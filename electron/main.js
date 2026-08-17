const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const fs = require('fs/promises');
const path = require('path');

const APP_NAME = 'Audit LBC Foret';

function assetPath(...parts) {
  return path.join(__dirname, '..', ...parts);
}

function sanitizeFilename(filename) {
  const base = String(filename || 'Audit_LBC.pdf')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  const withExt = base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
  if (withExt.length <= 170) return withExt;
  const stem = withExt.slice(0, 166).replace(/_+$/g, '') || 'Audit_LBC';
  return `${stem}.pdf`;
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 950,
    minWidth: 1180,
    minHeight: 760,
    backgroundColor: '#f4f7fb',
    title: 'Audit LBC Foret',
    icon: assetPath('build', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    show: false,
    webPreferences: {
      preload: assetPath('electron', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(() => ({
    action: 'allow',
    overrideBrowserWindowOptions: {
      width: 1280,
      height: 900,
      backgroundColor: '#ffffff',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    },
  }));

  win.webContents.on('will-navigate', (event, url) => {
    const localIndex = `file://${assetPath('index.html')}`;
    if (!url.startsWith('file://') && url !== localIndex) {
      event.preventDefault();
      shell.openExternal(url).catch(() => {});
    }
  });

  win.loadFile(assetPath('index.html'));
  return win;
}

async function exportPdfFromHtml(parentWindow, html, filename) {
  const defaultFilename = sanitizeFilename(filename);
  const { canceled, filePath } = await dialog.showSaveDialog(parentWindow, {
    title: 'Exporter le rapport PDF',
    defaultPath: path.join(app.getPath('documents'), defaultFilename),
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });

  if (canceled || !filePath) return { canceled: true };

  const pdfWindow = new BrowserWindow({
    show: false,
    width: 1280,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  try {
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(String(html || ''))}`);
    await new Promise((resolve) => setTimeout(resolve, 700));
    const pdfData = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      pageSize: 'A4',
    });
    await fs.writeFile(filePath, pdfData);
    return { canceled: false, filePath };
  } finally {
    if (!pdfWindow.isDestroyed()) pdfWindow.close();
  }
}

ipcMain.handle('audit-lbc-export-pdf', async (event, payload) => {
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  return exportPdfFromHtml(parentWindow, payload && payload.html, payload && payload.filename);
});

app.whenReady().then(() => {
  app.setAppUserModelId('com.controlunion.auditlbcforet');

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Fichier',
      submenu: [
        { role: 'reload', label: 'Recharger' },
        { type: 'separator' },
        { role: 'quit', label: 'Quitter' },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'resetZoom', label: 'Taille normale' },
        { role: 'zoomIn', label: 'Zoom avant' },
        { role: 'zoomOut', label: 'Zoom arriere' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein ecran' },
      ],
    },
  ]));

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
