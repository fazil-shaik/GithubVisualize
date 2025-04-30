import { AnalysisStatus, GraphDataResponse } from "@shared/schema";

// Define event types
type EventType = 'status' | 'analysisComplete' | 'error';

// Define event callback function types
type StatusCallback = (status: AnalysisStatus) => void;
type AnalysisCompleteCallback = (data: {
  graphData: any;
  repositoryInfo: any;
}) => void;
type ErrorCallback = (error: { message: string }) => void;

// Map of event types to their callback arrays
const eventListeners: Record<EventType, Function[]> = {
  status: [],
  analysisComplete: [],
  error: [],
};

// Create the WebSocket connection
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
// Using window.location.origin to get the correct host and protocol
const wsUrl = `${protocol}//${window.location.host}/ws`;
let socket: WebSocket | null = null;

// Function to connect to WebSocket server
const connect = () => {
  // Check if the socket is already open or connecting
  if (socket && 
      (socket.readyState === WebSocket.CONNECTING || 
       socket.readyState === WebSocket.OPEN)) {
    return;
  }

  // Close any existing socket before creating a new one
  if (socket) {
    try {
      socket.close();
    } catch (err) {
      console.error('Error closing existing WebSocket:', err);
    }
  }

  try {
    console.log(`Connecting to WebSocket at: ${wsUrl}`);
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Connected to WebSocket server successfully');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        
        // Fire the appropriate event handlers
        if (data.type && Array.isArray(eventListeners[data.type as EventType])) {
          eventListeners[data.type as EventType].forEach(callback => {
            callback(data.data);
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = (event) => {
      console.log(`WebSocket disconnected (code: ${event.code}, reason: ${event.reason}), reconnecting in 5 seconds...`);
      setTimeout(connect, 5000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    console.error('Error creating WebSocket connection:', error);
    // Try to reconnect after a delay
    setTimeout(connect, 5000);
  }
};

// Initialize connection when the window loads
if (typeof window !== 'undefined') {
  if (document.readyState === 'complete') {
    connect();
  } else {
    window.addEventListener('load', connect);
  }
}

// Event subscription functions
export const onStatus = (callback: StatusCallback) => {
  eventListeners.status.push(callback);
  return () => {
    const index = eventListeners.status.indexOf(callback as Function);
    if (index !== -1) {
      eventListeners.status.splice(index, 1);
    }
  };
};

export const onAnalysisComplete = (callback: AnalysisCompleteCallback) => {
  eventListeners.analysisComplete.push(callback);
  return () => {
    const index = eventListeners.analysisComplete.indexOf(callback as Function);
    if (index !== -1) {
      eventListeners.analysisComplete.splice(index, 1);
    }
  };
};

export const onError = (callback: ErrorCallback) => {
  eventListeners.error.push(callback);
  return () => {
    const index = eventListeners.error.indexOf(callback as Function);
    if (index !== -1) {
      eventListeners.error.splice(index, 1);
    }
  };
};

// Export the WebSocket instance
export default {
  onStatus,
  onAnalysisComplete,
  onError,
};
