import { useState, useEffect } from 'react';
import { Node, Edge } from '@shared/schema';

interface Repository {
  id: number;
  name: string;
  owner: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  branch: string;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface UseRepositoryReturn {
  repository: Repository | null;
  setRepository: (repo: Repository | null) => void;
  graphData: GraphData | null;
  setGraphData: (data: GraphData | null) => void;
}

export function useRepository(): UseRepositoryReturn {
  const [repository, setRepository] = useState<Repository | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  
  // Load from localStorage on initial render
  useEffect(() => {
    const savedRepo = localStorage.getItem('codeviz-repository');
    const savedGraphData = localStorage.getItem('codeviz-graph-data');
    
    if (savedRepo) {
      try {
        setRepository(JSON.parse(savedRepo));
      } catch (error) {
        console.error('Error parsing saved repository:', error);
        localStorage.removeItem('codeviz-repository');
      }
    }
    
    if (savedGraphData) {
      try {
        setGraphData(JSON.parse(savedGraphData));
      } catch (error) {
        console.error('Error parsing saved graph data:', error);
        localStorage.removeItem('codeviz-graph-data');
      }
    }
  }, []);
  
  // Save to localStorage when data changes
  useEffect(() => {
    if (repository) {
      localStorage.setItem('codeviz-repository', JSON.stringify(repository));
    } else {
      localStorage.removeItem('codeviz-repository');
    }
  }, [repository]);
  
  useEffect(() => {
    if (graphData) {
      localStorage.setItem('codeviz-graph-data', JSON.stringify(graphData));
    } else {
      localStorage.removeItem('codeviz-graph-data');
    }
  }, [graphData]);
  
  return {
    repository,
    setRepository,
    graphData,
    setGraphData
  };
}
