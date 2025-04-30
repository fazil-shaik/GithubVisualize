import { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import cola from "cytoscape-cola";
import dagre from "cytoscape-dagre";
import euler from "cytoscape-euler";

export interface GraphVisualizationHandle {
  animateWorkflowPath: (path: string[]) => void;
}

// Register layout extensions
try {
  // Register extensions only once
  if (typeof cytoscape !== 'undefined') {
    cytoscape.use(fcose);
    cytoscape.use(cola);
    cytoscape.use(dagre);
    cytoscape.use(euler);
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
  workflowPaths?: Record<string, string[]>;
  initialWorkflow?: string;
}

export const GraphVisualization = forwardRef<GraphVisualizationHandle, GraphVisualizationProps>(({
  nodes = [], 
  edges = [], 
  layout = 'force-directed',
  zoom = 1,
  onNodeClick,
  workflowPaths = {},
  initialWorkflow
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  
  // Function to animate code execution path through the graph
  const animateWorkflowPath = (path: string[]) => {
    if (!cyRef.current || !path.length) return;
    
    const cy = cyRef.current;
    
    // Reset any existing animations
    cy.elements().removeClass('path-highlight current-node');
    
    const animateNextNode = (index = 0) => {
      if (index >= path.length) return;
      
      const nodeId = path[index];
      const node = cy.getElementById(nodeId);
      
      if (node.length) {
        // Add current node highlight
        node.addClass('current-node');
        
        // If not the first node, create edge animation from previous to current
        if (index > 0) {
          const prevNodeId = path[index - 1];
          const edge = cy.edges(`[source="${prevNodeId}"][target="${nodeId}"]`);
          
          if (edge.length) {
            edge.addClass('path-highlight');
          }
        }
        
        // Add all nodes in the path to the path-highlight class
        path.slice(0, index + 1).forEach(id => {
          cy.getElementById(id).addClass('path-highlight');
        });
        
        // Animate to the next node after delay
        setTimeout(() => {
          node.removeClass('current-node');
          animateNextNode(index + 1);
        }, 500);
      } else {
        // Skip this node if not found
        animateNextNode(index + 1);
      }
    };
    
    // Start the animation sequence
    animateNextNode(0);
  };
  
  // Initialize cytoscape instance and setup graph
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Use the provided nodes and edges or empty arrays if none
    const nodeElements: Node[] = nodes.length > 0 ? nodes : [];
    const edgeElements: Edge[] = (edges.length > 0 && nodes.length > 0) ? edges : [];
    
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
        ...nodeElements.map(node => ({
          data: { 
            ...node,
            color: getNodeColor(node),
            size: getNodeSize(node)
          }
        })),
        ...edgeElements.map(edge => ({
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
            'transition-property': 'background-color, border-color, border-width, width, height, position, opacity',
            'transition-duration': 300,
            'transition-timing-function': 'ease-in-out-quad',
          }
        },
        {
          selector: 'node.animating',
          style: {
            'transition-duration': 300,
            'transition-timing-function': 'ease-in-out-cubic',
            'border-width': 3,
            'border-color': '#60A5FA',
            'border-opacity': 1,
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
            'transition-property': 'line-color, opacity, width, target-arrow-color',
            'transition-duration': 300,
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 3,
            'border-color': '#F97316',
            'text-opacity': 1,
            'border-opacity': 1,
            'z-index': 10,
            'overlay-color': 'rgba(249, 115, 22, 0.2)',
            'overlay-padding': 10,
            'overlay-opacity': 1,
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#F97316',
            'opacity': 1,
            'width': 3,
            'target-arrow-color': '#F97316',
            'z-index': 9,
          }
        },
        {
          selector: '.highlighted',
          style: {
            'background-color': '#10B981',
            'line-color': '#10B981',
            'target-arrow-color': '#10B981',
            'transition-duration': 500,
            'border-width': 4,
            'border-color': '#ffffff',
            'z-index': 11,
          }
        },
        {
          selector: '.faded',
          style: {
            'opacity': 0.3,
            'transition-duration': 500,
          }
        },
        {
          selector: '.path-highlight',
          style: {
            'background-color': '#EC4899', // pink-500
            'line-color': '#EC4899',
            'target-arrow-color': '#EC4899',
            'line-style': 'solid',
            'line-cap': 'round',
            'transition-duration': 500,
            'border-width': 4,
            'border-color': '#ffffff',
            'border-opacity': 1,
            'text-opacity': 1,
            'z-index': 12,
            'width': 6,           // Thicker edges
            'arrow-scale': 1.5,   // Larger arrows
            'curve-style': 'bezier',
            'control-point-step-size': 80, // Smoother curves
            'target-arrow-shape': 'triangle',
            'target-distance-from-node': 10,
            'source-distance-from-node': 5
          }
        },
        {
          selector: 'edge.path-highlight',
          style: {
            'label': '→',        // Add arrow symbol as label
            'font-size': '20px',
            'text-background-opacity': 0.7,
            'text-background-color': '#ffffff',
            'text-background-shape': 'roundrectangle',
            'text-background-padding': '3px',
            'text-valign': 'center',
            'text-outline-width': 2,
            'text-outline-color': '#ffffff',
            'text-outline-opacity': 0.8
          }
        },
        {
          selector: '.current-node',
          style: {
            'background-color': '#EF4444', // red-500
            'border-width': 5,
            'border-color': '#FECDD3', // red-200
            'border-opacity': 1,
            'text-opacity': 1,
            'z-index': 13,
            'overlay-color': 'rgba(239, 68, 68, 0.3)',
            'overlay-padding': 12,
            'overlay-opacity': 1,
            'transition-duration': 300,
            'width': 50,         // Larger current node
            'height': 50,
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 10,
            'text-outline-width': 3,
            'text-outline-color': '#ffffff',
            'text-outline-opacity': 1
          }
        },
        {
          selector: 'node.current-node',
          style: {
            'content': 'data(label)\n▶',  // Add play icon under label
            'text-transform': 'uppercase',
            'font-weight': 'bold',
            'text-max-width': '100px'
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
    
    // Add hover effects for better dependency visualization
    cy.on('mouseover', 'node', (e) => {
      const node = e.target;
      
      // Get connected edges and their connected nodes
      const connectedEdges = node.connectedEdges();
      const connectedNodes = connectedEdges.connectedNodes().filter((n: any) => n.id() !== node.id());
      
      // Add highlighted class to the current node and its connections
      node.addClass('highlighted');
      connectedEdges.addClass('highlighted');
      connectedNodes.addClass('highlighted');
      
      // Add faded class to all other elements
      cy.elements()
        .difference(node.union(connectedEdges).union(connectedNodes))
        .addClass('faded');
    });
    
    // Remove effects when mouse leaves
    cy.on('mouseout', 'node', (e) => {
      const node = e.target;
      cy.elements().removeClass('highlighted faded');
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
  
  // Animate initial workflow if provided
  useEffect(() => {
    if (initialWorkflow && workflowPaths && Object.keys(workflowPaths).length > 0) {
      const path = workflowPaths[initialWorkflow];
      if (path && path.length > 0) {
        // Wait for the layout to finish before starting animation
        setTimeout(() => {
          animateWorkflowPath(path);
        }, 1500);
      }
    }
  }, [initialWorkflow, workflowPaths, nodes, edges]);
  
  // Function to apply different layouts
  const applyLayout = (cy: cytoscape.Core, layoutName: string) => {
    let layoutConfig: any; // Use any type to bypass TypeScript errors with layout options
    
    switch (layoutName) {
      case 'force-directed':
        layoutConfig = {
          name: 'fcose',
          idealEdgeLength: 150,  // Increased for more spacing
          nodeRepulsion: 8000,   // Increased to push nodes further apart
          nodeOverlap: 30,       // Increased to prevent overlap
          randomize: true,       // Start with randomized positions
          padding: 50,           // Add padding around the layout
          fit: true,             // Fit the viewport to the graph
          animationDuration: 1000,
          quality: 'proof',      // Highest quality layout
        };
        break;
      case 'hierarchical':
        layoutConfig = {
          name: 'dagre',
          rankDir: 'TB',         // Top to bottom direction
          rankSep: 150,          // Increased vertical spacing
          nodeSep: 100,          // Increased horizontal spacing
          edgeSep: 80,           // Edge separation
          ranker: 'network-simplex', // Better for code dependencies
          animationDuration: 1000,
        };
        break;
      case 'circular':
        layoutConfig = {
          name: 'circle',
          radius: 250,           // Larger circle
          startAngle: Math.PI / 2, // Start from top
          sweep: 2 * Math.PI,    // Full circle
          padding: 50,           // Padding
          animationDuration: 1000,
        };
        break;
      case 'grid':
        layoutConfig = {
          name: 'grid',
          rows: undefined,       // Auto determine rows
          cols: undefined,       // Auto determine columns
          fit: true,             // Fit to viewport
          padding: 30,           // Grid padding
          avoidOverlap: true,    // Prevent node overlap
          animationDuration: 1000,
        };
        break;
      default:
        layoutConfig = {
          name: 'fcose',
          idealEdgeLength: 150,
          nodeRepulsion: 8000,
          nodeOverlap: 30,
          randomize: true,
          padding: 50,
          fit: true,
          animationDuration: 1000,
          quality: 'proof',
        };
    }
    
    // Use the layout with the configuration and add animation
    const layout = cy.layout(layoutConfig as cytoscape.LayoutOptions);
    
    // Add animation events for better visualization
    layout.one('layoutstart', () => {
      cy.nodes().addClass('animating');
    });
    
    layout.one('layoutstop', () => {
      cy.nodes().removeClass('animating');
    });
    
    layout.run();
  };
  
  // Expose the animateWorkflowPath method to parent components
  useImperativeHandle(ref, () => ({
    animateWorkflowPath
  }));

  return (
    <div ref={containerRef} style={{ width: '100%', height: 650 }} />
  );
});
