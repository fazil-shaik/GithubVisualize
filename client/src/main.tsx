import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "@/lib/websocket"; // Initialize WebSocket connection

createRoot(document.getElementById("root")!).render(<App />);
