import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { disableZoomInspect } from "./utils/utils";

// Disable zoom: block keyboard zoom (Ctrl/Cmd + Plus/Minus/0)
// Disable inspect: block right-click, F12, and devtools shortcuts
disableZoomInspect();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
