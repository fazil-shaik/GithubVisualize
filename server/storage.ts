import { 
  Repository, InsertRepository, File, InsertFile, 
  Dependency, InsertDependency, GraphData, InsertGraphData,
  Node, Edge
} from "@shared/schema";

export interface IStorage {
  // Repository methods
  getRepository(id: number): Promise<Repository | undefined>;
  getRepositoryByUrl(url: string): Promise<Repository | undefined>;
  getAllRepositories(): Promise<Repository[]>;
  createRepository(repository: InsertRepository): Promise<Repository>;
  
  // File methods
  getFile(id: number): Promise<File | undefined>;
  getFileByPath(repositoryId: number, path: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  getFilesByRepositoryId(repositoryId: number): Promise<File[]>;
  
  // Dependency methods
  createDependency(dependency: InsertDependency): Promise<Dependency>;
  getFileDependencies(fileId: number): Promise<File[]>;
  getFileImportedBy(fileId: number): Promise<File[]>;
  
  // Graph data methods
  createGraphData(graphData: InsertGraphData): Promise<GraphData>;
  getGraphData(repositoryId: number): Promise<GraphData | undefined>;
}

export class MemStorage implements IStorage {
  private repositories: Map<number, Repository>;
  private files: Map<number, File>;
  private dependencies: Map<number, Dependency>;
  private graphData: Map<number, GraphData>;
  private currentRepoId: number;
  private currentFileId: number;
  private currentDependencyId: number;
  private currentGraphDataId: number;

  constructor() {
    this.repositories = new Map();
    this.files = new Map();
    this.dependencies = new Map();
    this.graphData = new Map();
    this.currentRepoId = 1;
    this.currentFileId = 1;
    this.currentDependencyId = 1;
    this.currentGraphDataId = 1;
  }

  // Repository methods
  async getRepository(id: number): Promise<Repository | undefined> {
    return this.repositories.get(id);
  }

  async getRepositoryByUrl(url: string): Promise<Repository | undefined> {
    return Array.from(this.repositories.values()).find(
      (repo) => repo.url === url
    );
  }
  
  async getAllRepositories(): Promise<Repository[]> {
    return Array.from(this.repositories.values());
  }

  async createRepository(repository: InsertRepository): Promise<Repository> {
    const id = this.currentRepoId++;
    const newRepo: Repository = { ...repository, id };
    this.repositories.set(id, newRepo);
    return newRepo;
  }

  // File methods
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFileByPath(repositoryId: number, path: string): Promise<File | undefined> {
    return Array.from(this.files.values()).find(
      (file) => file.repositoryId === repositoryId && file.path === path
    );
  }

  async createFile(file: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const newFile: File = { ...file, id };
    this.files.set(id, newFile);
    return newFile;
  }

  async getFilesByRepositoryId(repositoryId: number): Promise<File[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.repositoryId === repositoryId
    );
  }

  // Dependency methods
  async createDependency(dependency: InsertDependency): Promise<Dependency> {
    const id = this.currentDependencyId++;
    const newDependency: Dependency = { ...dependency, id };
    this.dependencies.set(id, newDependency);
    return newDependency;
  }

  async getFileDependencies(fileId: number): Promise<File[]> {
    // Get all dependencies where this file is the source
    const dependencies = Array.from(this.dependencies.values()).filter(
      (dep) => dep.sourceId === fileId
    );
    
    // Get the target files
    const targetFiles: File[] = [];
    for (const dep of dependencies) {
      const file = await this.getFile(dep.targetId);
      if (file) {
        targetFiles.push(file);
      }
    }
    
    return targetFiles;
  }

  async getFileImportedBy(fileId: number): Promise<File[]> {
    // Get all dependencies where this file is the target
    const dependencies = Array.from(this.dependencies.values()).filter(
      (dep) => dep.targetId === fileId
    );
    
    // Get the source files
    const sourceFiles: File[] = [];
    for (const dep of dependencies) {
      const file = await this.getFile(dep.sourceId);
      if (file) {
        sourceFiles.push(file);
      }
    }
    
    return sourceFiles;
  }

  // Graph data methods
  async createGraphData(graphData: InsertGraphData): Promise<GraphData> {
    const id = this.currentGraphDataId++;
    const newGraphData: GraphData = { ...graphData, id };
    this.graphData.set(id, newGraphData);
    return newGraphData;
  }

  async getGraphData(repositoryId: number): Promise<GraphData | undefined> {
    return Array.from(this.graphData.values()).find(
      (data) => data.repositoryId === repositoryId
    );
  }
}

export const storage = new MemStorage();
