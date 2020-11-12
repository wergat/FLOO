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
    icon: path.join(__dirname, '../img/icon.ico'),
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  mainWindow.maximize();
  mainWindow.setIgnoreMouseEvents(IGNOREWINDOW, { forward: IGNOREWINDOW });
  winWebContents = mainWindow.webContents;

  console.log('Window Created');
}

// Printing the ABI versions for dev reasons
const nodeAbi = require("node-abi");
console.log(`Abi Elec: ${nodeAbi.getAbi("8.5.2","electron")}`);
console.log(`Abi Node: ${nodeAbi.getAbi("10.22.1","node")}`);

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

/**
 * Shoutout to iohook for having me install a .dll in the %TEMP% folder of every user....
 */
function installIOHookDLL() {
  return;
  const pathToDLL = 'node_modules\\iohook\\builds\\electron-v76-win32-x64\\build\\Release\\uiohook.dll';
  const devPath = ''; //'./out/FLOO-win32-x64/resources/app.asar';
  const fs = require('fs');

  // Get %TEMP%
  const tempFolder = app.getPath("temp");
  const targetFile = path.join(tempFolder, '/iohook.dll');
  if (fs.existsSync(targetFile)) {
    console.log("uihook.dll exists already!");
    return;
  }

  const asar = require('asar');
  const appAsar = path.join(app.getAppPath(), devPath);
  console.log("Path to asar file: " + appAsar);

  if (!fs.existsSync(appAsar)) {
    throw new Error("Could not find asar file");
  }

  let fileiohook = null;
  try {
    fileiohook = asar.extractFile(appAsar, pathToDLL);
    if (!fileiohook) {
      throw new Error("No DLL File found in app's asar");
    };
    fs.writeFileSync(targetFile, fileiohook);
    return true;
  } catch (e) {
    throw new Error("Cought error while trying to set uihook.dll \n Path: " + appAsar + " Looking for: " + pathToDLL + " \n Error:" + e);
  }
}

// Skipping inputs for better performance
let lastEvent: any;
let hasNewEvent = false;
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
  try {
    installIOHookDLL();
  } catch (e) {
    throw new Error(`Error installing iohook.dll \n ${e}`);
  }
  app.quit();
} else {
  let ioHook: any;
  // Check if we can load iohook properly
  try {
    ioHook = require('iohook');
  } catch (e) {
    // If not, try to fix it by creating %TEMP%/uihook.dll and re-try
    console.error(e);
    installIOHookDLL();
    // Lets try again
    try {
      ioHook = require('iohook');
    } catch (e) {
      // Auto-fix wont work, /shrug
      // maybe user can fix this
      throw new Error(`Error installing iohook not found fix twice \n ${e}`);
    }
  }

  const nativeImage = require('electron').nativeImage;
  const image = nativeImage.createFromPath(path.join(__dirname, '../img/icon.ico'));
  image.setTemplateImage(true);
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
    setInterval(function () {
      if (hasNewEvent) {
        winWebContents.send('mousedrag', lastEvent);
        hasNewEvent = false;
      }
    }, 25);
  });

  app.on('before-quit', () => {
    ioHook.unload();
    ioHook.stop();
  });

}
