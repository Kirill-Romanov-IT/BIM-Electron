// src/TitleBar.tsx

import React from 'react';

// Стили для нашей кастомной панели
const titleBarStyle: React.CSSProperties = {
  height: '30px',
  backgroundColor: '#2d3748',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '10px',
  color: '#e2e8f0',
  // @ts-ignore
  WebkitAppRegion: 'drag',
  userSelect: 'none',
};

const titleStyle: React.CSSProperties = {
  flexGrow: 1, // Занимает все доступное пространство
  fontSize: '14px',
};

const controlsContainerStyle: React.CSSProperties = {
  // @ts-ignore
  WebkitAppRegion: 'no-drag',
  display: 'flex',
};

const buttonStyle: React.CSSProperties = {
  width: '45px',
  height: '30px',
  border: 'none',
  backgroundColor: 'transparent',
  color: '#e2e8f0',
  fontSize: '16px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const buttonHoverStyle: React.CSSProperties = {
  backgroundColor: '#4a5568',
};

const closeButtonHoverStyle: React.CSSProperties = {
  backgroundColor: '#e53e3e',
  color: 'white',
};


const TitleBar = () => {
  // Функции для управления окном, которые мы "пробросили" в preload
  const handleMinimize = () => (window as any).electronAPI.minimize();
  const handleMaximize = () => (window as any).electronAPI.maximize();
  const handleClose = () => (window as any).electronAPI.close();

  return (
    <div style={titleBarStyle}>
      {/* Можно добавить иконку <img src="..." /> */}
      <span style={titleStyle}>Моё WebGPU Приложение</span>
      <div style={controlsContainerStyle}>
        <button style={buttonStyle} onClick={handleMinimize} onMouseEnter={e => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor || ''} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>-</button>
        <button style={buttonStyle} onClick={handleMaximize} onMouseEnter={e => e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor || ''} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>☐</button>
        <button style={buttonStyle} onClick={handleClose} onMouseEnter={e => e.currentTarget.style.backgroundColor = closeButtonHoverStyle.backgroundColor || ''} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>✕</button>
      </div>
    </div>
  );
};

export default TitleBar; 