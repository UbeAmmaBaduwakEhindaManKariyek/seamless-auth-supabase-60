
import { createRoot } from 'react-dom/client'
import { HashRouter, BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Always use HashRouter for static hosting to prevent 404 errors
const Router = HashRouter;

createRoot(document.getElementById("root")!).render(
  <Router>
    <App />
  </Router>
);
