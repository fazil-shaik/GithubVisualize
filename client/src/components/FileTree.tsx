import { useState } from "react";
import { getFileType, isDirectory } from "@/lib/utils";

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'directory';
  language?: string;
  children?: FileItem[];
}

interface FileTreeProps {
  files: FileItem[];
  searchQuery?: string;
  level?: number;
  selectedFile?: string;
  onSelectFile?: (file: FileItem) => void;
}

export function FileTree({ 
  files, 
  searchQuery = '', 
  level = 0,
  selectedFile,
  onSelectFile
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  // Filter files based on search query
  const filteredFiles = files.filter(file => {
    if (!searchQuery) return true;
    return file.name.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  return (
    <div className="text-sm">
      {filteredFiles.map((file) => {
        const isFolder = file.type === 'directory';
        const isExpanded = expandedFolders[file.id];
        const isSelected = selectedFile === file.id;
        
        // Get file type and icon
        const { icon, category } = isFolder 
          ? { icon: 'ri-folder-line', category: 'folder' }
          : getFileType(file.name);
          
        return (
          <div key={file.id} className="mb-1">
            <div 
              className={`flex items-center py-1 px-2 rounded cursor-pointer ${
                isSelected 
                  ? 'bg-primary-50 dark:bg-slate-700' 
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              onClick={() => {
                if (isFolder) {
                  toggleFolder(file.id);
                } else if (onSelectFile) {
                  onSelectFile(file);
                }
              }}
              style={{ paddingLeft: `${level > 0 ? level * 16 + 8 : 8}px` }}
            >
              {isFolder && (
                <i className={`${
                  isExpanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'
                } mr-1 text-slate-400`}></i>
              )}
              <i className={`${icon} mr-2 ${
                isFolder 
                  ? 'text-yellow-500' 
                  : file.language === 'typescript' || file.language === 'javascript'
                    ? 'text-primary-500'
                    : 'text-slate-500'
              }`}></i>
              <span className={isFolder ? 'font-medium' : 'font-mono text-xs'}>
                {file.name}
              </span>
            </div>
            
            {isFolder && isExpanded && file.children && file.children.length > 0 && (
              <FileTree 
                files={file.children} 
                searchQuery={searchQuery} 
                level={level + 1}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
