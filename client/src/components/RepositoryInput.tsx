import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RepositoryInputProps {
  onAnalyze: (url: string) => void;
}

export default function RepositoryInput({ onAnalyze }: RepositoryInputProps) {
  const [repoUrl, setRepoUrl] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (repoUrl.trim()) {
      onAnalyze(repoUrl);
    }
  };
  
  const handleQuickSelect = (url: string) => {
    setRepoUrl(url);
    onAnalyze(url);
  };
  
  return (
    <section className="mb-8 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Explore GitHub Repository</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <label htmlFor="repoUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Repository URL
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="ri-github-fill text-slate-400"></i>
                </div>
                <Input
                  type="text"
                  id="repoUrl"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="pl-10 pr-12"
                  placeholder="https://github.com/username/repository"
                />
                <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                  <button 
                    type="button"
                    className="inline-flex items-center border border-transparent rounded px-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-600 focus:ring-2 focus:ring-primary-500"
                  >
                    Recent
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-none">
              <label className="invisible block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Action
              </label>
              <Button 
                type="submit"
                className="h-10 w-full md:w-auto"
              >
                <i className="ri-search-line mr-2"></i>
                Analyze Repository
              </Button>
            </div>
          </div>
        </form>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <button 
            type="button"
            onClick={() => handleQuickSelect("https://github.com/facebook/react")}
            className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 shadow-sm text-xs font-medium rounded text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <i className="ri-reactjs-line mr-1"></i> facebook/react
          </button>
          <button 
            type="button"
            onClick={() => handleQuickSelect("https://github.com/vuejs/vue")}
            className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 shadow-sm text-xs font-medium rounded text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <i className="ri-vuejs-line mr-1"></i> vuejs/vue
          </button>
          <button 
            type="button"
            onClick={() => handleQuickSelect("https://github.com/typescript-cheatsheets/react")}
            className="inline-flex items-center px-2.5 py-1.5 border border-slate-300 dark:border-slate-600 shadow-sm text-xs font-medium rounded text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <i className="ri-code-line mr-1"></i> typescript-cheatsheets/react
          </button>
        </div>
      </div>
    </section>
  );
}
