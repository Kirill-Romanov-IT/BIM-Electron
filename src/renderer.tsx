import './index.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import WebGPUCanvas from './WebGPUCanvas';

// Предположим, у вас есть корневой компонент App
function App() {
  return (
    <div>
      <h1>План следующих шагов (с учётом Electron-старта)</h1>
      <p>№2: WebGPU-минимум. Рендерим вращающийся треугольник.</p>
      
      {/* 2. Вставляем компонент в разметку */}
      <WebGPUCanvas />
      
    </div>
  );
}

// Стандартный код для рендеринга React-приложения
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
