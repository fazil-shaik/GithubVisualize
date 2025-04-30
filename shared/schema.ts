import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Repository table
export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  owner: text("owner").notNull(),
  description: text("description"),
  lastAnalyzed: text("last_analyzed"),
  starsCount: integer("stars_count"),
  forksCount: integer("forks_count"),
  language: text("language"),
  branch: text("branch"),
});

export const insertRepositorySchema = createInsertSchema(repositories).pick({
  url: true,
  name: true,
  owner: true,
  description: true,
  lastAnalyzed: true,
  starsCount: true,
  forksCount: true,
  language: true,
  branch: true,
});

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull(),
  path: text("path").notNull(),
  type: text("type").notNull(), // file or directory
  language: text("language"),
  size: integer("size"),
  content: text("content"),
});

export const insertFileSchema = createInsertSchema(files).pick({
  repositoryId: true,
  path: true,
  type: true,
  language: true,
  size: true,
  content: true,
});

// Dependencies table
export const dependencies = pgTable("dependencies", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),
  targetId: integer("target_id").notNull(),
  type: text("type").notNull(), // import, extends, implements, etc.
});

export const insertDependencySchema = createInsertSchema(dependencies).pick({
  sourceId: true,
  targetId: true,
  type: true,
});

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    email: true,
    password: true,
    displayName: true,
    avatarUrl: true,
  });

// User favorites
export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  repositoryId: integer("repository_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserFavoriteSchema = createInsertSchema(userFavorites)
  .pick({
    userId: true,
    repositoryId: true,
  });

// Graph data structure
export const graphData = pgTable("graph_data", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull(),
  nodes: jsonb("nodes").notNull(),
  edges: jsonb("edges").notNull(),
});

export const insertGraphDataSchema = createInsertSchema(graphData).pick({
  repositoryId: true,
  nodes: true,
  edges: true,
});

// Types for API
export type Repository = typeof repositories.$inferSelect;
export type InsertRepository = z.infer<typeof insertRepositorySchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type Dependency = typeof dependencies.$inferSelect;
export type InsertDependency = z.infer<typeof insertDependencySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserFavorite = typeof userFavorites.$inferSelect;
export type InsertUserFavorite = z.infer<typeof insertUserFavoriteSchema>;

export type GraphData = typeof graphData.$inferSelect;
export type InsertGraphData = z.infer<typeof insertGraphDataSchema>;

// Request and response types
export interface RepositoryAnalysisRequest {
  url: string;
}

export interface AnalysisStatus {
  step: string;
  progress: number;
  currentFile?: string;
}

export interface Node {
  id: string;
  type: string;
  label: string;
  language?: string;
  size?: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
}

export interface GraphDataResponse {
  nodes: Node[];
  edges: Edge[];
  repositoryInfo: {
    name: string;
    owner: string;
    description: string;
    stars: number;
    forks: number;
    language: string;
    branch: string;
  };
}
