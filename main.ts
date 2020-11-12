/* Welcome to main.ts, also known as the Main Process */
import { app, BrowserWindow, screen, ipcMain } from 'electron';
import * as path from 'path';

import ioHook from 'iohook';
// "active-win": "^6.2.0",
// const activeWin = require('active-win');

const DEBUG = false;
const IGNOREWINDOW = true;

let winWebContents: Electron.WebContents;

app.allowRendererProcessReuse = true;

function createWindow() {
  // Create the browser window.
  const displays = screen.getAllDisplays();
  const externalDisplay = displays.find((display) => display.bounds.x !== 0 || display.bounds.y !== 0);

  const mainWindow = new BrowserWindow({
    // x: externalDisplay.bounds.x + 50,
    // y: externalDisplay.bounds.y + 50,
    width: 800,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  mainWindow.maximize();
  mainWindow.setIgnoreMouseEvents(IGNOREWINDOW, { forward: IGNOREWINDOW });
  winWebContents = mainWindow.webContents;

  console.log('Window Created');
}

// TODO: Move these into smaller functions
/** Focus changes on mouse down, usually, so we can check if the current window is planetside or not or something else */
function handleMouseDown(event: any) {
  // event.activeWindow = activeWin.sync();
  winWebContents.send('mousedown', event);
}

function handleMouseUp(event: any) {
  winWebContents.send('mouseup', event);
}

function handleMouseWheel(event: any) {
  winWebContents.send('mousewheel', event);
}


// Skipping inputs for better performance
let lastEvent: any;
let hasNewEvent = false;
setInterval(function () {
  if (hasNewEvent) {
    winWebContents.send('mousedrag', lastEvent);
    hasNewEvent = false;
  }
}, 25);

function handleMouseDrag(event: any) {
  lastEvent = event;
  hasNewEvent = true;
}

function keyEventHandler(event: any) {
  winWebContents.send('KeyEvent', event);
}

console.log('Starting...');

ipcMain.on('get-resolution', (event) => {
  let size = screen.getPrimaryDisplay().workAreaSize
  event.returnValue = { x: size.width, y: size.height };
})

ipcMain.on('close-app', (event) => {
  console.log("We are closing, sir!");
  app.quit();
})

// End application, since we don't want to update or install something
if (require('electron-squirrel-startup')) {
  app.quit();
} else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(() => {
    createWindow();

    // Hook into the mouse to observe outside of rendered areas
    ioHook.start(true);
    ioHook.on('mousedown', handleMouseDown);
    ioHook.on('mouseup', handleMouseUp);
    ioHook.on('mousewheel', handleMouseWheel);
    ioHook.on('mousedrag', handleMouseDrag);

    // ioHook.on('mousemove', mouseEventHandler);

    // ioHook.on('keydown', keyEventHandler);
    // ioHook.on('keyup', keyEventHandler);
  });

  app.on('before-quit', () => {
    ioHook.unload();
    ioHook.stop();
  });
}
