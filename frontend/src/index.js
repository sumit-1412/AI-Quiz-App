import React from "react";
import ReactDOM from "react-dom";
import "./index.css"; // You can add global styles here
import App from "./App"; // Import the App component
// import reportWebVitals from "./reportWebVitals"; // Optional for performance metrics

// Render the App component inside the div with id="root"
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);


