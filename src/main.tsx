
import { createRoot } from 'react-dom/client'
import { HashRouter, BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Use HashRouter for compatibility with GitHub Pages and other static hosts
// Or use BrowserRouter if you have proper server configuration
const Router = window.location.hostname === 'localhost' ? BrowserRouter : HashRouter;

createRoot(document.getElementById("root")!).render(
  <Router>
    <App />
  </Router>
);
