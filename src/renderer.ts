/* Welcome to renderer.ts, also known as the Renderer Process*/
import * as color from 'color';
import camera from "./camera";
import { handleRendererMouseEvent } from "./mouseEventHandler";
import { Coord, Rect, Platoon, Squad, Warpgate, Continent, ResolutionSettings, PlatoonHTMLElement } from "./classes";
import data from "./data";
import { addPlatoon, makeSquadMarkerDragAble, updateMapIfDragged, selectPosition, setWindowsFocus } from "./UIFunctions";
import { extendPlatoonList, OpenedPlatoonBox, reRenderLeftBox } from "./UIRendering";
import * as UI from "./UI";
import * as mapRendering from "./mapRendering";

// Isnt there like a better way to do this?

const { ipcRenderer, remote } = require('electron');



/** Window object */
let electronWindow: Electron.BrowserWindow = remote.getCurrentWindow();






/** We are updating the map when dragging only FPS/s often, so we safe if we dragged the map since last rendered frame */
let didDragMap = false;









/** Handles a simple click on a squad
 * onclick, a squad should start flickering or similar, signaling that it has not arrived at its location yet
 * another cllick should update a squad, singaling arrival 
 */
function handleSquadClick(elementStrID: string) {
    let ele = document.getElementById(elementStrID) as PlatoonHTMLElement;
    let i = ele.platoon; let j = ele.squad;
    //let inPosition = !Platoons[i].squads[j].isInPosition;
}















// Fill the camera with information
// Update Camera ScreenSize and Window Size
camera.setMapRenderSize(electronWindow.getSize()[0], electronWindow.getSize()[1]);
camera.setWindowSize(electronWindow.getSize()[0], electronWindow.getSize()[1]);
camera.setScreenSpaceCorners(data.resolutionData[0].mapBoundingBox);
console.log(data.resolutionData);
camera.setContinentSize(data.getCurrentContinent().mapBoxSize.x, data.getCurrentContinent().mapBoxSize.y);
console.log(camera.mapSpaceCorners);




ipcRenderer.on('MouseEvent', (event, message) => {
    handleRendererMouseEvent(message);
});

// Set framrate for drag updates to 60FPS for better performance when dragging stuff around
window.setInterval(function () {
    updateMapIfDragged();
    UI.updateDebugIfNeeded();
}, 1000.0 / 60.0);

// Buttons
document.getElementById("addPlatoonButton").onclick = function () {
    if (OpenedPlatoonBox >= 0) {
        extendPlatoonList(OpenedPlatoonBox);
        setTimeout(function () { addPlatoon(); }, 100);
    } else {
        addPlatoon();
    }
}


// Clearing the cache (TODO: why again?)
electronWindow.webContents.session.clearCache();

document.getElementById("debugDisplay").style.backgroundColor = "yellow";

// For each Elements that is of class clickable:
// Listen to mouse events when the mouse is on said elements, stop listening when leaving the element again
Array.from(document.getElementsByClassName("clickable")).forEach((el) => {
    el.addEventListener('mouseleave', () => { setWindowsFocus(false); });
    el.addEventListener('mouseenter', () => { setWindowsFocus(true); });
});

//SetWindowsFocus(true);

// Updating HTML based on loaded data
mapRendering.reRenderMapBody();
reRenderLeftBox();

