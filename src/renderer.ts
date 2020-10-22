/* Welcome to renderer.ts, also known as the Renderer Process*/
import * as Color from 'color';
import camera from "./camera";
import { handleRendererMouseEvent } from "./mouseEventHandler";
import data from "./data";
import { updateMapIfDragged, setWindowsFocus, restartRendering } from "./UIFunctions";
import { forceSettingsCheck, setAutoDetectResolution, loadSettingsData } from "./UIRendering";
import * as UI from "./UI";
import * as mapRendering from "./mapRendering";

// Isnt there like a better way to do this?

const { ipcRenderer, remote } = require('electron');



/** Window object */
let electronWindow: Electron.BrowserWindow = remote.getCurrentWindow();

// Load all data
data.reloadAllData();


// Load settings and check if they need any setup
let needChanges = data.loadSavedSettings();
let reso = `${electronWindow.getSize()[0]}x${electronWindow.getSize()[1]}`;
setAutoDetectResolution(reso);
console.log(`Detected Resolution: ${reso}`);

// Fill the camera with information
// Update Camera ScreenSize and Window Size
camera.initSetWindowSize(electronWindow.getSize()[0], electronWindow.getSize()[1]);
loadSettingsData();

// If settings arent setup properly, we can't render anything yet
if (needChanges) {
    // Force the user to check settings first, also PREVENT RENDERING AT ALL COST TO PREVENT ERROS
    mapRendering.disableRendering();
    forceSettingsCheck();
    console.log("We need some changes to those settings, please!");
}


ipcRenderer.on('MouseEvent', (event, message) => {
    handleRendererMouseEvent(message);
});

ipcRenderer.on('KeyEvent', (event, message) => {
    handleRendererKeyEvent(message);
});
// Set framrate for drag updates to 60FPS for better performance when dragging stuff around
window.setInterval(function () {
    updateMapIfDragged();
    UI.updateDebugIfNeeded();
}, 1000.0 / 60.0);

function handleRendererKeyEvent(message: any) {
    //console.log(message);
}

// Clearing the cache (TODO: why again?)
// electronWindow.webContents.session.clearCache();

//document.getElementById("debugDisplay").style.backgroundColor = "yellow";

// For each Elements that is of class clickable:
// Listen to mouse events when the mouse is on said elements, stop listening when leaving the element again
Array.from(document.getElementsByClassName("clickable")).forEach((el) => {
    el.addEventListener('mouseleave', () => { setWindowsFocus(false); });
    el.addEventListener('mouseenter', () => { setWindowsFocus(true); });
});





// Updating Map Rendering based on data now that everything should be okay
restartRendering();