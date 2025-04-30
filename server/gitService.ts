import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createHash } from 'crypto';
import { AnalyzedFile } from './codeAnalyzer';

const execPromise = promisify(exec);

export interface RepositoryInfo {
  url: string;
  name: string;
  owner: string;
  localPath: string;
  description?: string;
  stars?: number;
  forks?: number;
  language?: string;
  branch?: string;
}

export class GitService {
  private readonly workDir: string;
  
  constructor() {
    // Create a temporary directory for cloning repositories
    this.workDir = path.join(os.tmpdir(), 'codeviz-repos');
    this.ensureWorkDirExists();
  }
  
  private async ensureWorkDirExists() {
    try {
      await fs.mkdir(this.workDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create work directory:', error);
    }
  }
  
  private hashRepoUrl(url: string): string {
    return createHash('md5').update(url).digest('hex');
  }
  
  async cloneRepository(url: string): Promise<RepositoryInfo> {
    // Parse GitHub URL to extract owner and repo name
    const urlMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      throw new Error('Invalid GitHub repository URL');
    }
    
    const owner = urlMatch[1];
    const repoName = urlMatch[2].replace('.git', '');
    
    // Create a directory for this repository
    const repoHash = this.hashRepoUrl(url);
    const repoDir = path.join(this.workDir, repoHash);
    
    try {
      // Check if the repository is already cloned
      const stat = await fs.stat(repoDir);
      
      if (stat.isDirectory()) {
        // Pull the latest changes
        await execPromise(`git -C "${repoDir}" fetch --all && git -C "${repoDir}" reset --hard origin/main || git -C "${repoDir}" reset --hard origin/master`);
      }
    } catch (error) {
      // Directory doesn't exist, clone the repository
      await execPromise(`git clone --depth 1 ${url} "${repoDir}"`);
    }
    
    // Get repository information
    const { stdout: branchOutput } = await execPromise(`git -C "${repoDir}" rev-parse --abbrev-ref HEAD`);
    const branch = branchOutput.trim();
    
    // Create repository info object
    const repoInfo: RepositoryInfo = {
      url,
      name: repoName,
      owner,
      localPath: repoDir,
      branch,
    };
    
    // Try to get additional information from package.json or README
    try {
      const packageJsonPath = path.join(repoDir, 'package.json');
      const packageJsonContents = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageJsonContents);
      
      if (packageJson.description) {
        repoInfo.description = packageJson.description;
      }
      
      // Determine language based on package.json
      if (packageJson.devDependencies && packageJson.devDependencies.typescript) {
        repoInfo.language = 'TypeScript';
      } else {
        repoInfo.language = 'JavaScript';
      }
    } catch (error) {
      // package.json not found or invalid, try README
      try {
        const readmePath = path.join(repoDir, 'README.md');
        const readmeContents = await fs.readFile(readmePath, 'utf-8');
        const firstLine = readmeContents.split('\n')[0].replace(/[#\s]/g, '');
        
        if (!repoInfo.description && firstLine) {
          repoInfo.description = firstLine;
        }
      } catch (readmeError) {
        // README not found, ignore
      }
    }
    
    return repoInfo;
  }
  
  async getFileStructure(repoPath: string): Promise<AnalyzedFile[]> {
    const files: AnalyzedFile[] = [];
    
    // Get a list of all files in the repository
    const { stdout } = await execPromise(`git -C "${repoPath}" ls-files`);
    const filePaths = stdout.split('\n').filter(Boolean);
    
    // Process each file
    for (const relativePath of filePaths) {
      const fullPath = path.join(repoPath, relativePath);
      
      try {
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          files.push({
            path: relativePath,
            type: 'directory'
          });
        } else {
          const content = await fs.readFile(fullPath, 'utf-8');
          const extension = path.extname(relativePath).substring(1);
          
          files.push({
            path: relativePath,
            type: 'file',
            language: this.getLanguageFromExtension(extension),
            size: stat.size,
            content
          });
        }
      } catch (error) {
        console.error(`Error processing file ${relativePath}:`, error);
      }
    }
    
    // Add directories that might not be tracked by git
    const allDirs = new Set<string>();
    for (const file of files) {
      if (file.type === 'file') {
        const dirPath = path.dirname(file.path);
        if (dirPath !== '.' && dirPath !== '') {
          // Add all parent directories
          const parts = dirPath.split('/');
          let currentPath = '';
          for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            allDirs.add(currentPath);
          }
        }
      }
    }
    
    // Add directories that are not already in the files list
    for (const dir of allDirs) {
      if (!files.some(f => f.path === dir && f.type === 'directory')) {
        files.push({
          path: dir,
          type: 'directory'
        });
      }
    }
    
    return files;
  }
  
  async getRepositoryInfo(url: string): Promise<RepositoryInfo | null> {
    try {
      // Parse GitHub URL to extract owner and repo name
      const urlMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        return null;
      }
      
      const owner = urlMatch[1];
      const repoName = urlMatch[2].replace('.git', '');
      
      // Get the repository hash
      const repoHash = this.hashRepoUrl(url);
      const repoDir = path.join(this.workDir, repoHash);
      
      // Check if the repository exists locally
      try {
        const stat = await fs.stat(repoDir);
        if (!stat.isDirectory()) {
          return null;
        }
      } catch (error) {
        return null;
      }
      
      // Get the current branch
      let branch = 'main';
      try {
        const { stdout: branchOutput } = await execPromise(`git -C "${repoDir}" rev-parse --abbrev-ref HEAD`);
        branch = branchOutput.trim();
      } catch (error) {
        console.error('Error getting branch:', error);
      }
      
      // Create repository info object
      const repoInfo: RepositoryInfo = {
        url,
        name: repoName,
        owner,
        localPath: repoDir,
        branch,
      };
      
      // Try to get additional information from package.json or README
      try {
        const packageJsonPath = path.join(repoDir, 'package.json');
        const packageJsonContents = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContents);
        
        if (packageJson.description) {
          repoInfo.description = packageJson.description;
        }
        
        // Determine language based on package.json
        if (packageJson.devDependencies && packageJson.devDependencies.typescript) {
          repoInfo.language = 'TypeScript';
        } else {
          repoInfo.language = 'JavaScript';
        }
      } catch (error) {
        // package.json not found or invalid, try README
        try {
          const readmePath = path.join(repoDir, 'README.md');
          const readmeContents = await fs.readFile(readmePath, 'utf-8');
          const firstLine = readmeContents.split('\n')[0].replace(/[#\s]/g, '');
          
          if (!repoInfo.description && firstLine) {
            repoInfo.description = firstLine;
          }
        } catch (readmeError) {
          // README not found, ignore
        }
      }
      
      return repoInfo;
    } catch (error) {
      console.error('Error getting repository info:', error);
      return null;
    }
  }
  
  private getLanguageFromExtension(extension: string): string {
    const extensionMap: Record<string, string> = {
      'js': 'JavaScript',
      'jsx': 'JavaScript',
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'py': 'Python',
      'java': 'Java',
      'rb': 'Ruby',
      'php': 'PHP',
      'go': 'Go',
      'cs': 'C#',
      'c': 'C',
      'cpp': 'C++',
      'h': 'C',
      'hpp': 'C++',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'less': 'Less',
      'json': 'JSON',
      'md': 'Markdown',
      'sql': 'SQL',
      'sh': 'Shell',
      'bat': 'Batch',
      'ps1': 'PowerShell',
      'swift': 'Swift',
      'kt': 'Kotlin',
      'rs': 'Rust',
      'dart': 'Dart',
      'ex': 'Elixir',
      'exs': 'Elixir',
      'erl': 'Erlang',
      'hs': 'Haskell',
      'clj': 'Clojure',
      'scala': 'Scala',
      'pl': 'Perl',
      'r': 'R',
      'lua': 'Lua',
      'xml': 'XML',
      'yaml': 'YAML',
      'yml': 'YAML',
      'toml': 'TOML',
      'ini': 'INI',
      'graphql': 'GraphQL',
      'gql': 'GraphQL',
    };
    
    return extensionMap[extension] || 'Other';
  }
}
