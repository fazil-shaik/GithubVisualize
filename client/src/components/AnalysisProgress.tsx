interface AnalysisProgressProps {
  step: string;
  progress: number;
  currentFile?: string;
}

export default function AnalysisProgress({ step, progress, currentFile }: AnalysisProgressProps) {
  // Define the analysis steps in order
  const steps = [
    'Cloning repository',
    'Identifying file structure',
    'Parsing code files',
    'Building dependency graph'
  ];
  
  const currentStepIndex = steps.indexOf(step);
  
  return (
    <section className="mb-8 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Analyzing Repository</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400" id="progressPercentage">{progress}%</span>
        </div>
        
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-4">
          <div 
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          {steps.map((analysisStep, index) => (
            <div key={analysisStep} className="flex items-center">
              <div className={`mr-3 flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                index < currentStepIndex 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : index === currentStepIndex 
                    ? 'bg-primary-100 dark:bg-primary-900' 
                    : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                {index < currentStepIndex ? (
                  <i className="ri-check-line text-green-600 dark:text-green-400"></i>
                ) : index === currentStepIndex ? (
                  <i className="ri-loader-4-line animate-spin text-primary-600 dark:text-primary-400"></i>
                ) : (
                  <i className="ri-time-line text-slate-400"></i>
                )}
              </div>
              <span className={`${
                index < currentStepIndex || index === currentStepIndex
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {analysisStep}
              </span>
            </div>
          ))}
        </div>
        
        {currentFile && (
          <div className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            <i className="ri-information-line mr-1"></i> 
            Currently parsing: <span className="font-mono text-primary-600 dark:text-primary-400">{currentFile}</span>
          </div>
        )}
      </div>
    </section>
  );
}
