declare module 'cytoscape-fcose';
declare module 'cytoscape-cola';
declare module 'cytoscape-dagre';
declare module 'cytoscape-euler';

// Extend the cytoscape namespace to include the extensions
declare namespace cytoscape {
  interface LayoutOptions {
    // Force-directed layout options
    idealEdgeLength?: number;
    nodeRepulsion?: number;
    nodeOverlap?: number;
    
    // Hierarchical layout options
    rankDir?: string;
    rankSep?: number;
    nodeSep?: number;
  }
  
  // Add method to check for registered extensions
  interface Core {
    hasRegisteredExtension?(name: string): boolean;
  }
  
  namespace Ext {
    interface Layouts {
      fcose: any;
      cola: any;
      dagre: any;
      euler: any;
    }
  }
}