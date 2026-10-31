const { app, BrowserWindow, session, ipcMain, screen } = require('electron');
const path = require('path');

let win = null;

// Largest size that fits the screen's usable area (excludes taskbar).
function usableArea() {
  const display = win ? screen.getDisplayMatching(win.getBounds()) : screen.getPrimaryDisplay();
  return display.workArea;
}

function fitToScreen(width, height) {
  const area = usableArea();
  return {
    width: Math.min(width, area.width),
    height: Math.min(height, area.height)
  };
}

function centerOnScreen() {
  if (!win) return;
  const area = usableArea();
  const [w, h] = win.getSize();
  win.setPosition(
    Math.round(area.x + (area.width - w) / 2),
    Math.round(area.y + (area.height - h) / 2)
  );
}

function createWindow() {
  const start = fitToScreen(1200, 780);
  win = new BrowserWindow({
    width: start.width,
    height: start.height,
    minWidth: Math.min(900, start.width),
    minHeight: Math.min(600, start.height),
    backgroundColor: '#050b12',
    title: 'DeepFlow',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
  win.once('ready-to-show', () => {
    // Start maximised so Windows fits the window to the usable screen area itself
    win.maximize();
    return;
    // Force the window inside the usable screen area, in case a saved size is too tall
    const area = usableArea();
    const b = win.getBounds();
    if (b.width > area.width || b.height > area.height || b.y + b.height > area.y + area.height) {
      win.setBounds({
        x: area.x,
        y: area.y,
        width: Math.min(b.width, area.width),
        height: Math.min(b.height, area.height)
      });
    }
    centerOnScreen();
  });

  // F11 toggles fullscreen
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      event.preventDefault();
      win.setFullScreen(!win.isFullScreen());
    }
  });

  win.on('closed', () => { win = null; });
}

// Window controls requested by the renderer through preload.js
ipcMain.handle('window:toggleFullscreen', () => {
  if (!win) return false;
  win.setFullScreen(!win.isFullScreen());
  return win.isFullScreen();
});

ipcMain.handle('window:isFullscreen', () => (win ? win.isFullScreen() : false));

ipcMain.handle('window:setSize', (_event, w, h) => {
  if (!win || win.isFullScreen()) return false;
  const requested = {
    width: Math.min(3840, Math.max(900, Number(w) || 1200)),
    height: Math.min(2160, Math.max(600, Number(h) || 780))
  };
  const fitted = fitToScreen(requested.width, requested.height);
  win.setSize(fitted.width, fitted.height);
  centerOnScreen();
  return true;
});

app.whenReady().then(() => {

  // The YouTube embedded player refuses to play from file:// without a referrer (error 153).
  // Sending a normal HTTPS referrer for YouTube requests fixes this. It does not bypass playback rules.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://*.youtube.com/*', 'https://*.googleapis.com/*'] },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://localhost/';
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  createWindow();

    app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
