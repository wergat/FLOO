/* Welcome to main.ts, also known as the Main Process*/
import { app, BrowserWindow, screen } from "electron";
import * as path from "path";

const ioHook = require('iohook');
// "active-win": "^6.2.0",
//const activeWin = require('active-win');

const DEBUG = false
const IGNOREWINDOW = true;

let winWebContents: Electron.WebContents;

app.allowRendererProcessReuse = true;

function createWindow() {
  // Create the browser window.
  let displays = screen.getAllDisplays();
  let externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0
  });

  const mainWindow = new BrowserWindow({
    //x: externalDisplay.bounds.x + 50,
    //y: externalDisplay.bounds.y + 50,
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
  //mainWindow.webContents.openDevTools()
  winWebContents = mainWindow.webContents;

  console.log('Window Created');
}

/** Focus changes on mouse down, usually, so we can check if the current window is planetside or not or something else */
function handleMouseDown(event: any) {
  //event.activeWindow = activeWin.sync();
  mouseEventHandler(event);
}

function mouseEventHandler(event: any) {
  winWebContents.send('MouseEvent', event);
}

function keyEventHandler(event: any) {
  winWebContents.send('KeyEvent', event);
}

console.log("Starting...");

// End application, since we don't want to update or install something
if (require('electron-squirrel-startup')) {
  app.quit();
} else {
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
    ioHook.on('mousedown', handleMouseDown);
    ioHook.on('mouseup', mouseEventHandler);
    ioHook.on('mousewheel', mouseEventHandler);
    ioHook.on('mousemove', mouseEventHandler);
    ioHook.on('mousedrag', mouseEventHandler);
    ioHook.on('keydown', keyEventHandler);
    ioHook.on('keyup', keyEventHandler);

    if (process.env.NODE_ENV !== 'production') {
      require('vue-devtools').install()
      console.log("Dev Mode");
    }
  })

  app.on('before-quit', () => {
    ioHook.unload();
    ioHook.stop();
  });



}