import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { GitService } from "./gitService";
import { CodeAnalyzer } from "./codeAnalyzer";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { AnalysisStatus, RepositoryAnalysisRequest } from "@shared/schema";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Setup WebSockets for real-time updates
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Add CORS options that match the server's origin
    verifyClient: (info: { origin: string; secure: boolean; req: any }) => {
      console.log('WebSocket connection attempt from:', info.origin);
      return true; // Accept all connections for now
    }
  });
  
  wss.on('connection', (ws: WebSocket, req) => {
    const clientIp = req.socket.remoteAddress;
    console.log(`WebSocket client connected from ${clientIp}`);
    
    // Send a test ping message to confirm connection is working
    try {
      ws.send(JSON.stringify({
        type: 'status',
        data: { step: 'Connected', progress: 0 }
      }));
    } catch (err) {
      console.error('Error sending welcome message:', err);
    }
    
    ws.on('message', (message: string) => {
      console.log('Received message:', message);
      try {
        // Echo back the message as a test
        ws.send(JSON.stringify({
          type: 'status',
          data: { step: 'Message received', progress: 0 }
        }));
      } catch (err) {
        console.error('Error sending message response:', err);
      }
    });
    
    ws.on('close', (code, reason) => {
      console.log(`WebSocket client disconnected. Code: ${code}, Reason: ${reason || 'none'}`);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Create instances of our services
  const gitService = new GitService();
  const codeAnalyzer = new CodeAnalyzer();
  
  // Broadcast status updates to all connected clients
  const broadcastStatus = (status: AnalysisStatus) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'status', data: status }));
      }
    });
  };
  
  // Analyze repository API endpoint
  app.post('/api/analyze', async (req, res) => {
    try {
      const schema = z.object({
        url: z.string().url(),
      });
      
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid repository URL' });
      }
      
      const { url } = result.data;
      
      // Check if repository was already analyzed
      const existingRepo = await storage.getRepositoryByUrl(url);
      
      if (existingRepo) {
        return res.status(200).json({ 
          message: 'Repository already analyzed',
          repositoryId: existingRepo.id
        });
      }
      
      // Start analysis in the background
      res.status(202).json({ 
        message: 'Repository analysis started',
      });
      
      // Execute the repository analysis
      try {
        // 1. Clone or fetch repository
        broadcastStatus({ step: 'Cloning repository', progress: 10 });
        const repoInfo = await gitService.cloneRepository(url);
        
        // 2. Parse repository information and save it
        const repository = await storage.createRepository({
          url,
          name: repoInfo.name,
          owner: repoInfo.owner,
          description: repoInfo.description || '',
          lastAnalyzed: new Date().toISOString(),
          starsCount: repoInfo.stars || 0,
          forksCount: repoInfo.forks || 0,
          language: repoInfo.language || '',
          branch: repoInfo.branch || 'main',
        });
        
        // 3. Analyze file structure
        broadcastStatus({ step: 'Identifying file structure', progress: 30 });
        const files = await gitService.getFileStructure(repoInfo.localPath);
        
        // 4. Save files to storage
        for (const file of files) {
          broadcastStatus({ 
            step: 'Parsing code files', 
            progress: 50, 
            currentFile: file.path
          });
          
          await storage.createFile({
            repositoryId: repository.id,
            path: file.path,
            type: file.type,
            language: file.language || '',
            size: file.size || 0,
            content: file.content || '',
          });
        }
        
        // 5. Analyze code and build dependency graph
        broadcastStatus({ step: 'Building dependency graph', progress: 70 });
        const { nodes, edges } = await codeAnalyzer.analyzeDependencies(files, repository.id);
        
        // 6. Save graph data
        await storage.createGraphData({
          repositoryId: repository.id,
          nodes,
          edges,
        });
        
        // 7. Analysis complete
        broadcastStatus({ step: 'Analysis complete', progress: 100 });
        
        // 8. Send the final graph data to all clients
        const graphData = await storage.getGraphData(repository.id);
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: 'analysisComplete', 
              data: {
                graphData,
                repositoryInfo: {
                  id: repository.id,
                  name: repository.name,
                  owner: repository.owner,
                  description: repository.description,
                  stars: repository.starsCount,
                  forks: repository.forksCount,
                  language: repository.language,
                  branch: repository.branch,
                }
              }
            }));
          }
        });
        
      } catch (error) {
        console.error('Error analyzing repository:', error);
        broadcastStatus({ step: 'Error', progress: 0 });
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: 'error', 
              data: { message: 'Error analyzing repository' }
            }));
          }
        });
      }
      
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get repository info
  app.get('/api/repositories/:id', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.id);
      
      if (isNaN(repositoryId)) {
        return res.status(400).json({ message: 'Invalid repository ID' });
      }
      
      const repository = await storage.getRepository(repositoryId);
      
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }
      
      res.status(200).json(repository);
      
    } catch (error) {
      console.error('Error fetching repository:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get graph data for a repository
  app.get('/api/repositories/:id/graph', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.id);
      
      if (isNaN(repositoryId)) {
        return res.status(400).json({ message: 'Invalid repository ID' });
      }
      
      const graphData = await storage.getGraphData(repositoryId);
      
      if (!graphData) {
        return res.status(404).json({ message: 'Graph data not found' });
      }
      
      // Get repository information
      const repository = await storage.getRepository(repositoryId);
      
      if (!repository) {
        return res.status(404).json({ message: 'Repository not found' });
      }
      
      res.status(200).json({
        nodes: graphData.nodes,
        edges: graphData.edges,
        repositoryInfo: {
          name: repository.name,
          owner: repository.owner,
          description: repository.description,
          stars: repository.starsCount,
          forks: repository.forksCount,
          language: repository.language,
          branch: repository.branch,
        }
      });
      
    } catch (error) {
      console.error('Error fetching graph data:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get file details by path
  app.get('/api/repositories/:id/files', async (req, res) => {
    try {
      const repositoryId = parseInt(req.params.id);
      const path = req.query.path as string;
      
      if (isNaN(repositoryId)) {
        return res.status(400).json({ message: 'Invalid repository ID' });
      }
      
      if (!path) {
        return res.status(400).json({ message: 'Path parameter is required' });
      }
      
      const file = await storage.getFileByPath(repositoryId, path);
      
      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Get imports and imported by
      const imports = await storage.getFileDependencies(file.id);
      const importedBy = await storage.getFileImportedBy(file.id);
      
      res.status(200).json({
        file,
        imports,
        importedBy,
      });
      
    } catch (error) {
      console.error('Error fetching file details:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get file content directly by path
  app.get('/api/file-content', async (req, res) => {
    try {
      const path = req.query.path as string;
      
      if (!path) {
        return res.status(400).json({ message: 'Path parameter is required' });
      }
      
      // Get all repositories
      const repositories = await storage.getAllRepositories();
      let fileContent = '';
      let found = false;
      
      // Look in each repository for the file
      for (const repo of repositories) {
        try {
          const file = await storage.getFileByPath(repo.id, path);
          if (file) {
            fileContent = file.content || '// File content not available';
            found = true;
            break;
          }
        } catch (e) {
          // Continue to the next repository
          continue;
        }
      }
      
      if (!found) {
        // Try to read from the filesystem as a fallback
        try {
          const fs = require('fs');
          const gitServiceModule = await import('./gitService');
          const gitService = new gitServiceModule.GitService();
          
          // Look for the file in active repositories
          for (const repo of repositories) {
            const repoInfo = await gitService.getRepositoryInfo(repo.url);
            if (repoInfo && repoInfo.localPath) {
              const filePath = `${repoInfo.localPath}/${path}`;
              if (fs.existsSync(filePath)) {
                fileContent = fs.readFileSync(filePath, 'utf8');
                found = true;
                break;
              }
            }
          }
        } catch (fsError) {
          console.error('Error reading file from filesystem:', fsError);
        }
      }
      
      if (!found) {
        return res.status(404).json({ 
          message: 'File not found',
          content: '// File not found'
        });
      }
      
      res.status(200).json({
        content: fileContent
      });
      
    } catch (error) {
      console.error('Error fetching file content:', error);
      res.status(500).json({ 
        message: 'Internal server error',
        content: '// Error loading file content'
      });
    }
  });

  return httpServer;
}
