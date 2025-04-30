import { formatNumber } from "@/lib/utils";

interface RepositoryOverviewProps {
  name: string;
  owner: string;
  description: string;
  starsCount: number;
  forksCount: number;
  language: string;
  branch: string;
}

export default function RepositoryOverview({
  name,
  owner,
  description,
  starsCount,
  forksCount,
  language,
  branch
}: RepositoryOverviewProps) {
  return (
    <section className="mb-8 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center">
                <h2 className="text-xl font-bold mr-2">{owner}/{name}</h2>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <i className="ri-git-branch-line mr-1"></i> {branch}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <i className="ri-git-commit-line mr-1"></i> Last commit: <span className="text-slate-700 dark:text-slate-300">recently</span>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <i className="ri-star-line mr-1"></i> <span className="text-slate-700 dark:text-slate-300">{formatNumber(starsCount)}</span>
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <i className="ri-git-fork-line mr-1"></i> <span className="text-slate-700 dark:text-slate-300">{formatNumber(forksCount)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-2">
          <div className="flex flex-wrap items-center gap-y-2">
            <div className="font-medium text-sm mr-4">
              Language: <span className="text-primary-600 dark:text-primary-400">{language || "Unknown"}</span>
            </div>
            {/* Language tags could be added here based on the actual languages used in the repo */}
            <div className="flex flex-wrap gap-2 text-sm">
              {language && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {language}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
