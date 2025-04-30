import { useState, useEffect } from "react";
import Header from "@/components/Header";
import RepositoryInput from "@/components/RepositoryInput";
import RepositoryOverview from "@/components/RepositoryOverview";
import AnalysisProgress from "@/components/AnalysisProgress";
import VisualizationPanel from "@/components/VisualizationPanel";
import EmptyState from "@/components/EmptyState";
import { useRepository } from "@/hooks/useRepository";
import { onStatus, onAnalysisComplete, onError } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const { repository, setRepository, graphData, setGraphData } = useRepository();
  const [analysisStatus, setAnalysisStatus] = useState<{ step: string; progress: number; currentFile?: string } | null>(null);
  const [showEmptyState, setShowEmptyState] = useState(true);
  const [showAnalysisProgress, setShowAnalysisProgress] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);

  // Handle repository analysis submission
  const handleAnalyzeRepository = async (url: string) => {
    try {
      // Hide empty state and show analysis progress
      setShowEmptyState(false);
      setShowAnalysisProgress(true);
      
      // Reset states
      setRepository(null);
      setGraphData(null);
      setShowVisualization(false);
      
      // Send the repository URL to the API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze repository');
      }
      
      // Status messages will be sent via WebSocket
    } catch (error) {
      console.error('Error analyzing repository:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze repository",
        variant: "destructive",
      });
      
      // Reset states
      setShowEmptyState(true);
      setShowAnalysisProgress(false);
      setRepository(null);
      setGraphData(null);
    }
  };

  // Setup WebSocket event listeners
  useEffect(() => {
    // Status update listener
    const statusUnsubscribe = onStatus((status) => {
      setAnalysisStatus(status);
      
      if (status.progress === 100) {
        // Analysis is complete, but we'll wait for the actual data
        // before showing the visualization
      }
    });
    
    // Analysis complete listener
    const analysisCompleteUnsubscribe = onAnalysisComplete((data) => {
      setRepository(data.repositoryInfo);
      setGraphData(data.graphData);
      
      // Update UI states
      setShowAnalysisProgress(false);
      setShowOverview(true);
      setShowVisualization(true);
    });
    
    // Error listener
    const errorUnsubscribe = onError((error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      
      // Reset states
      setShowEmptyState(true);
      setShowAnalysisProgress(false);
      setShowOverview(false);
      setShowVisualization(false);
    });
    
    // Cleanup listeners
    return () => {
      statusUnsubscribe();
      analysisCompleteUnsubscribe();
      errorUnsubscribe();
    };
  }, [toast, setRepository, setGraphData]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RepositoryInput onAnalyze={handleAnalyzeRepository} />
        
        {showOverview && repository && (
          <RepositoryOverview 
            name={repository.name}
            owner={repository.owner}
            description={repository.description || ""}
            starsCount={repository.stars || 0}
            forksCount={repository.forks || 0}
            language={repository.language || ""}
            branch={repository.branch || "main"}
          />
        )}
        
        {showAnalysisProgress && analysisStatus && (
          <AnalysisProgress 
            step={analysisStatus.step}
            progress={analysisStatus.progress}
            currentFile={analysisStatus.currentFile}
          />
        )}
        
        {showVisualization && graphData && (
          <VisualizationPanel
            nodes={graphData.nodes}
            edges={graphData.edges}
          />
        )}
        
        {showEmptyState && (
          <EmptyState onGetStarted={() => {
            document.getElementById('repoUrl')?.focus();
          }} />
        )}
      </main>
      
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-primary-500 text-white p-1.5 rounded">
                <i className="ri-code-box-line text-lg"></i>
              </div>
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">CodeViz</span>
            </div>
            
            <div className="flex space-x-6">
              <a href="https://github.com" className="text-slate-500 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-400">
                <i className="ri-github-fill text-xl"></i>
              </a>
              <a href="https://twitter.com" className="text-slate-500 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-400">
                <i className="ri-twitter-x-fill text-xl"></i>
              </a>
              <a href="https://linkedin.com" className="text-slate-500 hover:text-primary-500 dark:text-slate-400 dark:hover:text-primary-400">
                <i className="ri-linkedin-box-fill text-xl"></i>
              </a>
            </div>
          </div>
          
          <div className="mt-4 text-center md:text-left text-sm text-slate-500 dark:text-slate-400">
            &copy; 2023 CodeViz. All rights reserved. Built with ❤️ for developers.
          </div>
        </div>
      </footer>
    </div>
  );
}
