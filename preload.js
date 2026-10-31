// Safe bridge between the interface and the window controls in main.js.
const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('desktop', {
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),
  isFullscreen: () => ipcRenderer.invoke('window:isFullscreen'),
  setSize: (w, h) => ipcRenderer.invoke('window:setSize', w, h),
  getFilePath: (file) => webUtils.getPathForFile(file)
});
