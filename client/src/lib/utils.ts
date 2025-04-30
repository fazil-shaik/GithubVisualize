import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Extracts owner and repo name from github URL
export function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== 'github.com') {
      return null;
    }
    
    const parts = parsedUrl.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return {
        owner: parts[0],
        repo: parts[1]
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Format a number with k/m suffix for large numbers
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

// Get file extension
export function getFileExtension(filename: string): string | null {
  const parts = filename.split('.');
  if (parts.length === 1) {
    return null;
  }
  return parts[parts.length - 1].toLowerCase();
}

// Get file type (icon and category) based on extension
export function getFileType(filename: string): { icon: string; category: string } {
  const extension = getFileExtension(filename);
  
  if (!extension) {
    return { icon: 'ri-file-line', category: 'other' };
  }
  
  const extensionMap: Record<string, { icon: string; category: string }> = {
    js: { icon: 'ri-javascript-line', category: 'script' },
    jsx: { icon: 'ri-reactjs-line', category: 'react' },
    ts: { icon: 'ri-typescript-line', category: 'script' },
    tsx: { icon: 'ri-reactjs-line', category: 'react' },
    css: { icon: 'ri-css3-line', category: 'style' },
    scss: { icon: 'ri-css3-line', category: 'style' },
    less: { icon: 'ri-css3-line', category: 'style' },
    html: { icon: 'ri-html5-line', category: 'markup' },
    json: { icon: 'ri-file-code-line', category: 'data' },
    md: { icon: 'ri-markdown-line', category: 'documentation' },
    py: { icon: 'ri-python-line', category: 'script' },
    java: { icon: 'ri-code-line', category: 'script' },
    go: { icon: 'ri-code-line', category: 'script' },
    php: { icon: 'ri-code-line', category: 'script' },
    rb: { icon: 'ri-code-line', category: 'script' },
    c: { icon: 'ri-code-line', category: 'script' },
    cpp: { icon: 'ri-code-line', category: 'script' },
    h: { icon: 'ri-code-line', category: 'script' },
    sh: { icon: 'ri-terminal-line', category: 'script' },
    bat: { icon: 'ri-terminal-line', category: 'script' },
    ps1: { icon: 'ri-terminal-line', category: 'script' },
    svg: { icon: 'ri-image-line', category: 'asset' },
    png: { icon: 'ri-image-line', category: 'asset' },
    jpg: { icon: 'ri-image-line', category: 'asset' },
    jpeg: { icon: 'ri-image-line', category: 'asset' },
    gif: { icon: 'ri-image-line', category: 'asset' },
    webp: { icon: 'ri-image-line', category: 'asset' },
    pdf: { icon: 'ri-file-pdf-line', category: 'document' },
    doc: { icon: 'ri-file-word-line', category: 'document' },
    docx: { icon: 'ri-file-word-line', category: 'document' },
    xls: { icon: 'ri-file-excel-line', category: 'document' },
    xlsx: { icon: 'ri-file-excel-line', category: 'document' },
    ppt: { icon: 'ri-file-ppt-line', category: 'document' },
    pptx: { icon: 'ri-file-ppt-line', category: 'document' },
    zip: { icon: 'ri-file-zip-line', category: 'archive' },
    rar: { icon: 'ri-file-zip-line', category: 'archive' },
    tar: { icon: 'ri-file-zip-line', category: 'archive' },
    gz: { icon: 'ri-file-zip-line', category: 'archive' },
  };
  
  return extensionMap[extension] || { icon: 'ri-file-line', category: 'other' };
}

// Check if a path is a directory
export function isDirectory(path: string): boolean {
  return !path.includes('.');
}

// Generate a suitable color for a language
export function languageToColor(language: string): string {
  const colorMap: Record<string, string> = {
    javascript: 'yellow',
    typescript: 'blue',
    python: 'green',
    java: 'red',
    go: 'cyan',
    html: 'orange',
    css: 'blue',
    ruby: 'red',
    php: 'purple',
    c: 'gray',
    'c++': 'blue',
    'c#': 'purple',
    shell: 'gray',
    rust: 'orange',
    swift: 'orange',
    kotlin: 'purple',
    dart: 'cyan',
  };
  
  const lang = language.toLowerCase();
  return colorMap[lang] || 'slate';
}
