import path from 'path';
import fs from 'fs/promises';
import { Node, Edge } from '@shared/schema';
import { getFileExtension } from '../client/src/lib/utils';

export interface AnalyzedFile {
  path: string;
  type: string;
  language?: string;
  size?: number;
  content?: string;
}

export class CodeAnalyzer {
  async analyzeDependencies(files: AnalyzedFile[], repositoryId: number): Promise<{ nodes: Node[], edges: Edge[] }> {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Create a map to quickly look up files by path
    const fileMap = new Map<string, AnalyzedFile>();
    files.forEach(file => {
      fileMap.set(file.path, file);
    });
    
    // Process each file to find dependencies
    for (const file of files) {
      // Skip directories
      if (file.type === 'directory') {
        continue;
      }
      
      // Add node for this file
      nodes.push({
        id: file.path,
        type: file.type,
        label: path.basename(file.path),
        language: file.language,
        size: file.size
      });
      
      // For JS/TS files, extract imports
      const ext = getFileExtension(file.path);
      if (ext && ['js', 'jsx', 'ts', 'tsx'].includes(ext) && file.content) {
        const imports = this.extractImports(file.content, file.path);
        
        // Create edges for each import
        for (const importPath of imports) {
          // Find the absolute path of the imported file
          const resolvedImport = this.resolveImportPath(importPath, file.path, fileMap);
          
          if (resolvedImport) {
            edges.push({
              id: `${file.path}->${resolvedImport}`,
              source: file.path,
              target: resolvedImport,
              type: 'import'
            });
          }
        }
      }
    }
    
    return { nodes, edges };
  }
  
  private extractImports(content: string, filePath: string): string[] {
    const imports: string[] = [];
    
    // Regular expressions to capture different import syntaxes
    const importRegexes = [
      // ES6 imports: import X from 'path'
      /import\s+(?:.+\s+from\s+)?['"]([^'"]+)['"]/g,
      // CommonJS require: const X = require('path')
      /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
      // Dynamic imports: import('path')
      /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ];
    
    for (const regex of importRegexes) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const importPath = match[1];
        if (importPath && !importPath.startsWith('@')) {
          imports.push(importPath);
        }
      }
    }
    
    return [...new Set(imports)]; // Remove duplicates
  }
  
  private resolveImportPath(importPath: string, currentFilePath: string, fileMap: Map<string, AnalyzedFile>): string | null {
    // Skip node_modules and absolute imports
    if (importPath.startsWith('node_modules/') || importPath.startsWith('/') || importPath.includes('://')) {
      return null;
    }
    
    // Handle relative imports
    const currentDir = path.dirname(currentFilePath);
    let resolvedPath = path.resolve(currentDir, importPath);
    
    // Check if the import points to a file directly
    if (fileMap.has(resolvedPath)) {
      return resolvedPath;
    }
    
    // Try with extensions
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
    for (const ext of extensions) {
      const pathWithExt = `${resolvedPath}${ext}`;
      if (fileMap.has(pathWithExt)) {
        return pathWithExt;
      }
    }
    
    // Try with index files
    for (const ext of extensions) {
      const indexPath = path.join(resolvedPath, `index${ext}`);
      if (fileMap.has(indexPath)) {
        return indexPath;
      }
    }
    
    return null;
  }
}
