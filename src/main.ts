import { app, BrowserWindow } from "electron";
import * as path from "path";


//TODO: Remove this, and node-abi module
const nodeAbi = require('node-abi')
const runtime = process.versions['electron'] ? 'electron' : 'node';
const essential = runtime + '-v' + process.versions.modules + '-' + process.platform + '-' + process.arch;
const modulePath = path.join(__dirname, 'builds', essential, 'build', 'Release', 'iohook.node');
console.info('The path is:', modulePath);
console.info("Electron:" + nodeAbi.getTarget('80', 'electron'));
console.info("Electron:" + nodeAbi.getTarget('8.5.2', 'electron'));
// END OF TODO


const ioHook = require('iohook');

const DEBUG = false
const IGNOREWINDOW = true;

let winWebContents: Electron.WebContents;

app.allowRendererProcessReuse = true;

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    transparent: (!DEBUG),
    alwaysOnTop: (!DEBUG),
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "../index.html"));
  mainWindow.maximize();
  mainWindow.setIgnoreMouseEvents(IGNOREWINDOW, { forward: IGNOREWINDOW });
  mainWindow.webContents.openDevTools()
  winWebContents = mainWindow.webContents;

  console.log('Window Created');
}


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Hook into the mouse to observe outside of rendered areas
  ioHook.start(true);
  ioHook.on('mousedown', eventHandler);
  ioHook.on('mouseup', eventHandler);
  ioHook.on('mousewheel', eventHandler);
  ioHook.on('mousemove', eventHandler);
  ioHook.on('mousedrag', eventHandler);
})


function eventHandler(event: any) {
  winWebContents.send('MouseEvent', event);
}

app.on('before-quit', () => {
  ioHook.unload();
  ioHook.stop();
});