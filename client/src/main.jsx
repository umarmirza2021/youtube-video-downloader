import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DownloaderPage from './pages/DownloaderPage';
import { SEO_PAGES } from './config/seo-pages.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {SEO_PAGES.map((page) => (
          <Route key={page.key} path={page.path} element={<DownloaderPage />} />
        ))}
        <Route path="*" element={<DownloaderPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);