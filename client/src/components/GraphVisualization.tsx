import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import cola from "cytoscape-cola";
import dagre from "cytoscape-dagre";
import euler from "cytoscape-euler";

// Register layout extensions
try {
  // Check if the layouts are already registered to avoid re-registration
  if (typeof cytoscape !== 'undefined') {
    if (!cytoscape.prototype.hasRegisteredExtension('fcose')) cytoscape.use(fcose);
    if (!cytoscape.prototype.hasRegisteredExtension('cola')) cytoscape.use(cola);
    if (!cytoscape.prototype.hasRegisteredExtension('dagre')) cytoscape.use(dagre);
    if (!cytoscape.prototype.hasRegisteredExtension('euler')) cytoscape.use(euler);
  }
} catch (error) {
  console.error("Error registering Cytoscape extensions:", error);
}

interface Node {
  id: string;
  label: string;
  type: string;
  language?: string;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
}

interface GraphVisualizationProps {
  nodes: Node[];
  edges: Edge[];
  layout?: string;
  zoom?: number;
  onNodeClick?: (nodeId: string) => void;
}

export function GraphVisualization({ 
  nodes = [], 
  edges = [], 
  layout = 'force-directed',
  zoom = 1,
  onNodeClick
}: GraphVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  
  // Initialize cytoscape instance and setup graph
  useEffect(() => {
    if (!containerRef.current) return;
    
    // If we don't have real data yet, create a sample graph
    const sampleNodes = nodes.length > 0 ? nodes : [
      { id: 'button', label: 'Button.tsx', type: 'file' },
      { id: 'styles', label: 'styles.css', type: 'file' },
      { id: 'utils', label: 'utils.ts', type: 'file' },
      { id: 'icon', label: 'Icon.tsx', type: 'file' },
      { id: 'theme', label: 'theme.ts', type: 'file' },
      { id: 'types', label: 'types.ts', type: 'file' },
    ];
    
    const sampleEdges = edges.length > 0 ? edges : [
      { id: 'e1', source: 'button', target: 'styles', type: 'import' },
      { id: 'e2', source: 'button', target: 'utils', type: 'import' },
      { id: 'e3', source: 'button', target: 'icon', type: 'import' },
      { id: 'e4', source: 'button', target: 'theme', type: 'import' },
      { id: 'e5', source: 'theme', target: 'types', type: 'import' },
    ];
    
    const getNodeColor = (node: Node) => {
      switch (node.type) {
        case 'directory':
          return '#F59E0B'; // amber-500
        case 'file':
          if (node.language === 'typescript' || node.language === 'javascript') {
            return '#3B82F6'; // blue-500
          } else if (node.language === 'css' || node.language === 'scss') {
            return '#10B981'; // emerald-500
          } else if (node.language === 'json') {
            return '#6366F1'; // indigo-500
          } else if (node.language === 'markdown') {
            return '#8B5CF6'; // violet-500
          } else {
            return '#6B7280'; // gray-500
          }
        default:
          return '#3B82F6'; // blue-500
      }
    };
    
    const getNodeSize = (node: Node) => {
      switch (node.type) {
        case 'directory':
          return 40;
        case 'file':
          return 30;
        default:
          return 25;
      }
    };
    
    const cy = cytoscape({
      container: containerRef.current,
      elements: [
        ...sampleNodes.map(node => ({
          data: { 
            ...node,
            color: getNodeColor(node),
            size: getNodeSize(node)
          }
        })),
        ...sampleEdges.map(edge => ({
          data: edge
        }))
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(label)',
            'color': '#fff',
            'text-outline-color': 'data(color)',
            'text-outline-width': 2,
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '10px',
            'width': 'data(size)',
            'height': 'data(size)',
            'text-max-width': '80px',
            'text-wrap': 'ellipsis',
            'text-overflow-wrap': 'anywhere',
            'border-width': 2,
            'border-color': '#fff',
            'border-opacity': 0.8,
            'text-opacity': 0.8,
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': '#94A3B8',
            'opacity': 0.7,
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': '#94A3B8',
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#F97316',
            'text-opacity': 1,
            'border-opacity': 1,
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#F97316',
            'opacity': 1,
            'width': 3,
            'target-arrow-color': '#F97316',
          }
        }
      ],
      layout: {
        name: 'preset', // Initial layout doesn't matter, we'll set it below
      },
      wheelSensitivity: 0.3,
    });
    
    // Store the instance in a ref
    cyRef.current = cy;
    
    // Add click event listener
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      if (onNodeClick) {
        onNodeClick(node.id());
      }
    });
    
    // Apply the selected layout
    applyLayout(cy, layout);
    
    // Cleanup
    return () => {
      cy.destroy();
    };
  }, [nodes, edges, onNodeClick]);
  
  // Handle layout changes
  useEffect(() => {
    if (cyRef.current) {
      applyLayout(cyRef.current, layout);
    }
  }, [layout]);
  
  // Handle zoom changes
  useEffect(() => {
    if (cyRef.current) {
      cyRef.current.zoom(zoom);
      cyRef.current.center();
    }
  }, [zoom]);
  
  // Function to apply different layouts
  const applyLayout = (cy: cytoscape.Core, layoutName: string) => {
    let layoutConfig: cytoscape.LayoutOptions;
    
    switch (layoutName) {
      case 'force-directed':
        layoutConfig = {
          name: 'fcose',
          idealEdgeLength: 100,
          nodeRepulsion: 5000,
          nodeOverlap: 20,
          animationDuration: 1000,
        };
        break;
      case 'hierarchical':
        layoutConfig = {
          name: 'dagre',
          rankDir: 'TB',
          rankSep: 100,
          nodeSep: 50,
          animationDuration: 1000,
        };
        break;
      case 'circular':
        layoutConfig = {
          name: 'circle',
          animationDuration: 1000,
        };
        break;
      case 'grid':
        layoutConfig = {
          name: 'grid',
          animationDuration: 1000,
        };
        break;
      default:
        layoutConfig = {
          name: 'fcose',
          idealEdgeLength: 100,
          nodeRepulsion: 5000,
          nodeOverlap: 20,
          animationDuration: 1000,
        };
    }
    
    cy.layout(layoutConfig).run();
  };
  
  return (
    <div ref={containerRef} style={{ width: '100%', height: 500 }} />
  );
}
