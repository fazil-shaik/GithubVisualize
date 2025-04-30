import { useState, useRef, useEffect, useMemo } from "react";
import { FileTree } from "@/components/FileTree";
import { GraphVisualization, GraphVisualizationHandle } from "@/components/GraphVisualization";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Node, Edge } from "@shared/schema";

interface VisualizationPanelProps {
  nodes: Node[];
  edges: Edge[];
}

interface FileDetails {
  path: string;
  language?: string;
  linesCount: number;
  imports: { path: string; type: string }[];
  importedBy: { path: string; type: string }[];
  content?: string;
}

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'directory';
  language?: string;
  children?: FileItem[];
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileDetails | null>(null);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const graphRef = useRef<GraphVisualizationHandle>(null);
  
  // Generate auto-detected workflow paths based on node dependencies
  const workflowPaths = useMemo(() => {
    // Only generate paths if we have nodes and edges
    if (!nodes.length || !edges.length) return {};
    
    // Helper function to find entry points (files that are imported but don't import others)
    const findEntryPoints = () => {
      const importers = new Set(edges.map(e => e.source));
      const importees = new Set(edges.map(e => e.target));
      
      // Entry points are files that are imported but don't import others
      return Array.from(importees).filter(id => !importers.has(id));
    };
    
    // Helper function to find UI components (usually have names containing specific patterns)
    const findUIComponents = () => {
      return nodes
        .filter(node => 
          node.type === 'file' && 
          (node.label.includes('Button') || 
           node.label.includes('Form') || 
           node.label.includes('Input') || 
           node.label.includes('Card') ||
           node.label.includes('Modal') ||
           node.label.includes('Dialog'))
        )
        .map(node => node.id);
    };
    
    // Helper to find data fetching files (usually have utility functions or hooks)
    const findDataFetchingFiles = () => {
      return nodes
        .filter(node => 
          node.type === 'file' && 
          (node.label.includes('api') || 
           node.label.includes('fetch') || 
           node.label.includes('http') || 
           node.label.includes('axios') ||
           node.label.includes('request'))
        )
        .map(node => node.id);
    };
    
    // Build common workflow paths
    const entryPoints = findEntryPoints();
    const uiComponents = findUIComponents();
    const dataFiles = findDataFetchingFiles();
    
    // Generate authentication workflow (if exists)
    const authFiles = nodes
      .filter(node => 
        node.type === 'file' && 
        (node.label.toLowerCase().includes('auth') || 
         node.label.toLowerCase().includes('login') || 
         node.label.toLowerCase().includes('user'))
      )
      .map(node => node.id);
    
    // Generate form submission workflow (if exists)
    const formFiles = nodes
      .filter(node => 
        node.type === 'file' && 
        (node.label.toLowerCase().includes('form') || 
         node.label.toLowerCase().includes('input') || 
         node.label.toLowerCase().includes('submit'))
      )
      .map(node => node.id);
    
    const paths: Record<string, string[]> = {};
    
    if (authFiles.length >= 2) {
      paths['authentication'] = authFiles;
    }
    
    if (dataFiles.length >= 2) {
      paths['data-fetching'] = dataFiles;
    }
    
    if (formFiles.length >= 2) {
      paths['form-submission'] = formFiles;
    }
    
    return paths;
  }, [nodes, edges]);
  
  // Function to animate a workflow path
  const handleAnimateWorkflow = (workflow: string) => {
    setSelectedWorkflow(workflow);
    if (graphRef.current && workflowPaths[workflow]) {
      graphRef.current.animateWorkflowPath(workflowPaths[workflow]);
    }
  };
  
  // Handle node selection
  const handleNodeSelection = async (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setIsLoadingFile(true);
    
    try {
      // Get incoming and outgoing edges for this node
      const imports = edges
        .filter(edge => edge.source === nodeId)
        .map(edge => ({ 
          path: edge.target, 
          type: nodes.find(n => n.id === edge.target)?.type || 'unknown' 
        }));
      
      const importedBy = edges
        .filter(edge => edge.target === nodeId)
        .map(edge => ({ 
          path: edge.source,
          type: nodes.find(n => n.id === edge.source)?.type || 'unknown'
        }));
      
      // Get file content if available
      let content = "";
      try {
        const response = await fetch(`/api/file-content?path=${encodeURIComponent(nodeId)}`);
        if (response.ok) {
          const data = await response.json();
          content = data.content || "// File content not available";
        } else {
          content = "// File content not available";
        }
      } catch (e) {
        console.error("Could not fetch file content:", e);
        content = "// File content not available";
      }
      
      // Use node information from graph data
      const selectedNode = nodes.find(n => n.id === nodeId);
      
      setSelectedFile({
        path: nodeId,
        language: selectedNode?.language,
        linesCount: content.split('\n').length,
        imports,
        importedBy,
        content
      });
    } catch (error) {
      console.error("Error fetching file details:", error);
    } finally {
      setIsLoadingFile(false);
    }
  };
  
  // Generate file tree structure from nodes
  const fileStructure = useMemo<FileItem[]>(() => {
    if (!nodes.length) return [];
    
    const fileMap = new Map<string, FileItem>();
    const rootItems: FileItem[] = [];
    
    // First pass: create all file and directory nodes
    nodes.forEach(node => {
      const pathParts = node.id.split('/');
      const name = pathParts[pathParts.length - 1];
      const isDirectory = node.type === 'directory';
      
      const fileItem: FileItem = {
        id: node.id,
        name,
        type: isDirectory ? 'directory' : 'file',
        language: node.language,
        children: isDirectory ? [] : undefined
      };
      
      fileMap.set(node.id, fileItem);
      
      // If it's a top-level item, add to rootItems
      if (pathParts.length === 1) {
        rootItems.push(fileItem);
      }
    });
    
    // Second pass: build the tree hierarchy
    nodes.forEach(node => {
      const pathParts = node.id.split('/');
      
      // Skip top-level items
      if (pathParts.length === 1) return;
      
      // Find the parent directory
      const parentPath = pathParts.slice(0, -1).join('/');
      const parent = fileMap.get(parentPath);
      
      if (parent && parent.children) {
        const currentFile = fileMap.get(node.id);
        if (currentFile) {
          parent.children.push(currentFile);
        }
      }
    });
    
    return rootItems;
  }, [nodes]);
  
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
                ref={graphRef}
                nodes={nodes} 
                edges={edges} 
                layout={selectedLayout}
                zoom={zoom}
                workflowPaths={workflowPaths}
                initialWorkflow={selectedWorkflow || undefined}
                onNodeClick={handleNodeSelection}
              />
            </div>
          </div>
          
          {/* Workflow Animation Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-semibold">Workflow Visualization</h3>
              
              <div className="text-sm text-slate-600 dark:text-slate-300">
                Select a workflow to visualize the code execution path:
              </div>
              
              <div className="flex flex-wrap gap-2">
                {(Object.keys(workflowPaths) as Array<keyof typeof workflowPaths>).map((workflow) => (
                  <Button
                    key={workflow}
                    variant={selectedWorkflow === workflow ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleAnimateWorkflow(workflow)}
                    className="flex items-center gap-1"
                  >
                    <i className="ri-route-line"></i>
                    {workflow.replace(/-/g, ' ')}
                  </Button>
                ))}
              </div>
              
              {selectedWorkflow && (
                <div className="mt-2 text-sm">
                  <div className="flex items-center text-amber-600 dark:text-amber-400">
                    <i className="ri-information-line mr-1"></i>
                    Animating the {selectedWorkflow.replace(/-/g, ' ')} workflow path
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Selected Node Details */}
          {selectedFile ? (
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
                  {selectedFile.imports.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {selectedFile.imports.map((imp, index) => (
                        <li key={index} className="flex items-center">
                          <i className="ri-arrow-right-line mr-2 text-primary-500"></i>
                          <a 
                            href="#" 
                            className="text-primary-600 dark:text-primary-400 hover:underline font-mono text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNodeSelection(imp.path);
                            }}
                          >
                            {imp.path}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No imports found</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">Imported By</h3>
                  {selectedFile.importedBy.length > 0 ? (
                    <ul className="space-y-2 text-sm">
                      {selectedFile.importedBy.map((imp, index) => (
                        <li key={index} className="flex items-center">
                          <i className="ri-arrow-left-line mr-2 text-orange-500"></i>
                          <a 
                            href="#" 
                            className="text-primary-600 dark:text-primary-400 hover:underline font-mono text-xs"
                            onClick={(e) => {
                              e.preventDefault();
                              handleNodeSelection(imp.path);
                            }}
                          >
                            {imp.path}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">This file is not imported by other files</p>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2 text-slate-600 dark:text-slate-300">Code Preview</h3>
                <div className="bg-slate-800 rounded-md p-4 font-mono text-xs text-slate-200 overflow-x-auto">
                  <pre>{selectedFile.content}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-center">
              <i className="ri-file-list-line text-4xl text-slate-400 mb-3"></i>
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Select a file to view details</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                Click on any node in the graph to view its dependencies, imports, and code content
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
