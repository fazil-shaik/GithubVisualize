import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onGetStarted: () => void;
}

export default function EmptyState({ onGetStarted }: EmptyStateProps) {
  return (
    <section className="my-20 text-center animate-in fade-in duration-300">
      <div className="max-w-md mx-auto">
        <div className="w-64 h-64 mx-auto mb-6 rounded-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-primary-700/30"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
              <i className="ri-code-box-line text-6xl text-primary-500"></i>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Visualize Any GitHub Repository</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Enter a GitHub repository URL to analyze its structure and visualize code dependencies in an interactive graph.
        </p>
        
        <Button onClick={onGetStarted} size="lg">
          Get Started
        </Button>
      </div>
    </section>
  );
}
