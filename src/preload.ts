// src/preload.ts

import { contextBridge, ipcRenderer } from 'electron';

// Мы "пробрасываем" только нужные нам функции в React-приложение
// Это безопасно
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
});
