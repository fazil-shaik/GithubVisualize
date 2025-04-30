import { useTheme } from "@/lib/themeProvider";

export default function Header() {
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-primary-500 text-white p-2 rounded-lg">
            <i className="ri-code-box-line text-xl"></i>
          </div>
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">CodeViz</h1>
          <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500 dark:text-slate-400">BETA</span>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <i className="ri-sun-line dark:hidden text-lg"></i>
            <i className="ri-moon-line hidden dark:block text-lg"></i>
          </button>
          
          {/* User Menu (placeholder) */}
          <div className="relative">
            <button className="flex items-center space-x-1 text-sm font-medium">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center text-primary-500 dark:text-primary-400">
                <i className="ri-user-line"></i>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
