import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';  // Thêm dòng này
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>  {/* Thêm BrowserRouter để bao bọc App */}
      <App />
    </BrowserRouter>
  </StrictMode>,
);