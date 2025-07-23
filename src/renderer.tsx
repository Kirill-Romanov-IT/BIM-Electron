// src/renderer.tsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import WebGPUCanvas from './WebGPUCanvas';
import TitleBar from './TitleBar'; // <-- Импортируем наш компонент

function App() {
  return (
    // Главный контейнер
    <div style={{ background: '#1a202c', color: '#e2e8f0', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Наш кастомный заголовок */}
      <TitleBar />

      {/* 2. Остальное содержимое приложения */}
      <div style={{ flexGrow: 1, padding: '0rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: '#90cdf4', marginBottom: '1.5rem' }}>
          WebGPU в Electron React
        </h1>
        
        <WebGPUCanvas />

        <p style={{ marginTop: '1rem', color: '#a0aec0' }}>
          Треугольник, отрисованный с помощью WebGPU.
        </p>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
