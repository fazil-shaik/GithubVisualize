import { 
  Repository, InsertRepository, File, InsertFile, 
  Dependency, InsertDependency, GraphData, InsertGraphData,
  User, InsertUser, UserFavorite, InsertUserFavorite,
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
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  // User favorites methods
  getUserFavorites(userId: number): Promise<Repository[]>;
  addUserFavorite(userFavorite: InsertUserFavorite): Promise<UserFavorite>;
  removeUserFavorite(userId: number, repositoryId: number): Promise<void>;
  
  // Graph data methods
  createGraphData(graphData: InsertGraphData): Promise<GraphData>;
  getGraphData(repositoryId: number): Promise<GraphData | undefined>;
}

export class MemStorage implements IStorage {
  private repositories: Map<number, Repository>;
  private files: Map<number, File>;
  private dependencies: Map<number, Dependency>;
  private graphData: Map<number, GraphData>;
  private users: Map<number, User>;
  private userFavorites: Map<number, UserFavorite>;
  private currentRepoId: number;
  private currentFileId: number;
  private currentDependencyId: number;
  private currentGraphDataId: number;
  private currentUserId: number;
  private currentUserFavoriteId: number;

  constructor() {
    this.repositories = new Map();
    this.files = new Map();
    this.dependencies = new Map();
    this.graphData = new Map();
    this.users = new Map();
    this.userFavorites = new Map();
    this.currentRepoId = 1;
    this.currentFileId = 1;
    this.currentDependencyId = 1;
    this.currentGraphDataId = 1;
    this.currentUserId = 1;
    this.currentUserFavoriteId = 1;
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
    const newRepo: Repository = { 
      ...repository, 
      id, 
      description: repository.description || null,
      lastAnalyzed: repository.lastAnalyzed || null,
      starsCount: repository.starsCount || null,
      forksCount: repository.forksCount || null,
      language: repository.language || null,
      branch: repository.branch || null
    };
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
    const newFile: File = { 
      ...file, 
      id, 
      language: file.language || null,
      size: file.size || null,
      content: file.content || null
    };
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

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const createdAt = new Date();
    const updatedAt = new Date();
    
    const newUser: User = { 
      ...user, 
      id, 
      createdAt, 
      updatedAt, 
      displayName: user.displayName || user.username,
      avatarUrl: user.avatarUrl || null
    };
    
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const user = await this.getUser(id);
    
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser: User = {
      ...user,
      ...userData,
      id,
      updatedAt: new Date()
    };
    
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // User favorites methods
  async getUserFavorites(userId: number): Promise<Repository[]> {
    const favorites = Array.from(this.userFavorites.values()).filter(
      (favorite) => favorite.userId === userId
    );
    
    const repositories: Repository[] = [];
    for (const favorite of favorites) {
      const repo = await this.getRepository(favorite.repositoryId);
      if (repo) {
        repositories.push(repo);
      }
    }
    
    return repositories;
  }

  async addUserFavorite(userFavorite: InsertUserFavorite): Promise<UserFavorite> {
    const id = this.currentUserFavoriteId++;
    const createdAt = new Date();
    
    // Check if this favorite already exists
    const exists = Array.from(this.userFavorites.values()).find(
      (fav) => fav.userId === userFavorite.userId && fav.repositoryId === userFavorite.repositoryId
    );
    
    if (exists) {
      return exists;
    }
    
    const newFavorite: UserFavorite = {
      ...userFavorite,
      id,
      createdAt
    };
    
    this.userFavorites.set(id, newFavorite);
    return newFavorite;
  }

  async removeUserFavorite(userId: number, repositoryId: number): Promise<void> {
    const favorite = Array.from(this.userFavorites.values()).find(
      (fav) => fav.userId === userId && fav.repositoryId === repositoryId
    );
    
    if (favorite) {
      this.userFavorites.delete(favorite.id);
    }
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
