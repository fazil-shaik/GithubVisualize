import { useState } from "react";
import { FileTree } from "@/components/FileTree";
import { GraphVisualization } from "@/components/GraphVisualization";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface VisualizationPanelProps {
  nodes: any[];
  edges: any[];
}

export default function VisualizationPanel({ nodes, edges }: VisualizationPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTypes, setFileTypes] = useState({
    react: true,
    script: true,
    style: false,
    documentation: false,
  });
  const [vizType, setVizType] = useState("dependencies");
  const [graphDepth, setGraphDepth] = useState("all");
  const [selectedLayout, setSelectedLayout] = useState("force-directed");
  const [zoom, setZoom] = useState(1);
  
  // Sample file structure for demonstration
  const fileStructure = [
    {
      id: 'src',
      name: 'src',
      type: 'directory',
      children: [
        {
          id: 'components',
          name: 'components',
          type: 'directory',
          children: [
            { id: 'Button.tsx', name: 'Button.tsx', type: 'file', language: 'typescript' },
            { id: 'Card.tsx', name: 'Card.tsx', type: 'file', language: 'typescript' },
            { id: 'Input.tsx', name: 'Input.tsx', type: 'file', language: 'typescript' },
          ],
        },
        {
          id: 'hooks',
          name: 'hooks',
          type: 'directory',
          children: [],
        },
        {
          id: 'utils',
          name: 'utils',
          type: 'directory',
          children: [],
        },
      ],
    },
    { id: 'package.json', name: 'package.json', type: 'file', language: 'json' },
    { id: 'README.md', name: 'README.md', type: 'file', language: 'markdown' },
  ];
  
  // Selected file details (simulated)
  const selectedFile = {
    path: 'src/components/Button.tsx',
    language: 'typescript',
    size: 1420, // bytes
    linesCount: 142,
    imports: [
      { path: './styles.css', type: 'style' },
      { path: '../utils.ts', type: 'utility' },
      { path: './Icon.tsx', type: 'component' },
      { path: '../theme.ts', type: 'utility' },
    ],
    importedBy: [
      { path: '../components/Card.tsx', type: 'component' },
      { path: '../components/Form.tsx', type: 'component' },
      { path: '../pages/Login.tsx', type: 'page' },
      { path: '../pages/Register.tsx', type: 'page' },
    ],
    content: `import React from 'react';
import './styles.css';
import { validateProps } from '../utils';
import Icon from './Icon';
import { useTheme } from '../theme';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  children,
  onClick,
}) => {
  const theme = useTheme();
  // More code...`
  };
  
  const handleFileTypeChange = (type: keyof typeof fileTypes) => {
    setFileTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };
  
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };
  
  const handleReset = () => {
    setZoom(1);
  };
  
  return (
    <section className="animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5 mb-6">
            <h2 className="text-lg font-semibold mb-4">Files Structure</h2>
            
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-search-line text-slate-400"></i>
              </div>
              <Input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-2 text-sm"
              />
            </div>
            
            <div className="max-h-[500px] overflow-y-auto pr-1">
              <FileTree files={fileStructure} searchQuery={searchQuery} />
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold mb-4">Filters</h2>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1 block">File Types</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="fileType-react" 
                      checked={fileTypes.react} 
                      onCheckedChange={() => handleFileTypeChange('react')}
                    />
                    <label htmlFor="fileType-react" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      .tsx, .jsx (React)
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="fileType-script" 
                      checked={fileTypes.script} 
                      onCheckedChange={() => handleFileTypeChange('script')}
                    />
                    <label htmlFor="fileType-script" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      .ts, .js (Scripts)
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="fileType-style" 
                      checked={fileTypes.style} 
                      onCheckedChange={() => handleFileTypeChange('style')}
                    />
                    <label htmlFor="fileType-style" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      .css, .scss (Styles)
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="fileType-docs" 
                      checked={fileTypes.documentation} 
                      onCheckedChange={() => handleFileTypeChange('documentation')}
                    />
                    <label htmlFor="fileType-docs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      .md, .txt (Documentation)
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-1 block">Visualization Type</Label>
                <RadioGroup value={vizType} onValueChange={setVizType} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dependencies" id="viz-dependencies" />
                    <Label htmlFor="viz-dependencies">Dependencies Graph</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file-structure" id="viz-file-structure" />
                    <Label htmlFor="viz-file-structure">File Structure Tree</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label htmlFor="graph-depth" className="text-sm font-medium mb-1 block">Graph Depth</Label>
                <Select value={graphDepth} onValueChange={setGraphDepth}>
                  <SelectTrigger id="graph-depth">
                    <SelectValue placeholder="Select depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="level-1">Level 1 (Direct Dependencies)</SelectItem>
                    <SelectItem value="level-2">Level 2 (Secondary Dependencies)</SelectItem>
                    <SelectItem value="level-3">Level 3 (Tertiary Dependencies)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Visualization Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Graph Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleZoomIn}
                  className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <i className="ri-zoom-in-line mr-1"></i> Zoom In
                </button>
                <button 
                  onClick={handleZoomOut}
                  className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <i className="ri-zoom-out-line mr-1"></i> Zoom Out
                </button>
                <button 
                  onClick={handleReset}
                  className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <i className="ri-refresh-line mr-1"></i> Reset
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">Layout:</span>
                <Select value={selectedLayout} onValueChange={setSelectedLayout}>
                  <SelectTrigger className="text-sm h-8 w-40">
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="force-directed">Force-Directed</SelectItem>
                    <SelectItem value="hierarchical">Hierarchical</SelectItem>
                    <SelectItem value="circular">Circular</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                  </SelectContent>
                </Select>
                
                <button className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <i className="ri-download-line mr-1"></i> Export
                </button>
              </div>
            </div>
          </div>
          
          {/* Visualization Area */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center text-xs text-slate-500 dark:text-slate-400">
              <i className="ri-information-line mr-1"></i>
              Click on nodes to expand and explore dependencies. Drag to reposition. Use mouse wheel to zoom.
            </div>
            
            <div className="graph-container p-4 relative" id="graphContainer">
              <GraphVisualization 
                nodes={nodes} 
                edges={edges} 
                layout={selectedLayout}
                zoom={zoom}
              />
            </div>
          </div>
          
          {/* Selected Node Details */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                File Details: <span className="text-primary-600 dark:text-primary-400 font-mono">{selectedFile.path}</span>
              </h2>
              <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <span><i className="ri-scales-line mr-1"></i> {selectedFile.linesCount} lines</span>
                <span><i className="ri-link-m mr-1"></i> {selectedFile.imports.length} imports</span>
                <span><i className="ri-link-unlink-m mr-1"></i> {selectedFile.importedBy.length} imported by</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">Imports</h3>
                <ul className="space-y-2 text-sm">
                  {selectedFile.imports.map((imp, index) => (
                    <li key={index} className="flex items-center">
                      <i className="ri-arrow-right-line mr-2 text-primary-500"></i>
                      <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline font-mono text-xs">{imp.path}</a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">Imported By</h3>
                <ul className="space-y-2 text-sm">
                  {selectedFile.importedBy.map((imp, index) => (
                    <li key={index} className="flex items-center">
                      <i className="ri-arrow-left-line mr-2 text-orange-500"></i>
                      <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline font-mono text-xs">{imp.path}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">Code Preview</h3>
              <div className="bg-slate-800 rounded-md p-4 font-mono text-xs text-slate-200 overflow-x-auto">
                <pre>{selectedFile.content}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
