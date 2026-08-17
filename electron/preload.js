const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('auditLbcDesktop', {
  isDesktop: true,
  platform: process.platform,
  exportPdf: (payload) => ipcRenderer.invoke('audit-lbc-export-pdf', payload),
});
