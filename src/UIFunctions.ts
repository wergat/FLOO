import { platoon, squad, platoonHTMLElement, coord } from "./classes"
import data from "./data";
import camera from "./camera";
import * as mapRendering from "./mapRendering";
import * as color from 'color';
import * as UIRendering from "./UIRendering";
let electronWindow: Electron.BrowserWindow = require('electron').remote.getCurrentWindow();



/** We are updating the map when dragging only FPS/s often, so we safe if we dragged the map since last rendered frame */
let didDragMap: boolean;


/** Is the mouse currently on a interactable UI element? (Or is the window focused right now) */
let FOCUS = true;


/** Debug mode on/off? */
let DEBUG = false;



/** Adds one platoon of filled squads near the warpgate. Rerenders everything afterwards */
function addPlatoon() {
    let platoonNumber = data.getPlatoonCount();
    let ptColor: color;
    // Get color from plat color array
    if (platoonNumber < data.platColors.length) {
        ptColor = data.platColors[platoonNumber];
    } else {// Just invent some new color if we run out of preset options  
        ptColor = color.rgb(Math.random() * 255, Math.random() * 255, Math.random() * 255);
    }

    let pt = new platoon(ptColor);
    // Add 4 empty squads first to push the platoon into the list
    pt.squads = [new squad(platoonNumber, "a", { x: 0, y: 0 }), new squad(platoonNumber, "b", { x: 0, y: 0 }), new squad(platoonNumber, "c", { x: 0, y: 0 }), new squad(platoonNumber, "d", { x: 0, y: 0 })];
    data.platoons.push(pt);

    // Now fill the squads and spawn them near the warpgate one after another so they dont intersect
    // Fill one squad at a time so the squads dont overlap
    let pos: coord; let newSquad: squad;
    for (var i = 0; i < 4; i++) {
        // Get current squad data 
        newSquad = data.getSquad(platoonNumber, i);
        // Get Free Position near warpgate
        pos = data.getFreePositionNearWarpgate();
        // Update squad status and position
        newSquad.isEmpty = false;
        newSquad.pos = pos;
        // save squad data
        data.setSquad(platoonNumber, i, newSquad)
    }

    UIRendering.reRenderPlatoonBox();
    mapRendering.reRenderMapBody();
}

/** Sets a flag when the map is dragged so it gets rerendered next frame */
function setMapAsDragged() {
    didDragMap = true;
}

/** Handles the rendering when the camera gets dragged around
 * gets called every FPS/s, so we dont update the render too often
 */
function updateMapIfDragged() {
    if (didDragMap) {
        // Update all squad markers with updated camera position
        mapRendering.updateSquadMarkerPositions();
        didDragMap = false;
    }
}


/** Selects the continentID and warpgateID 
*/
function selectPosition(continentID: number, warpgateID: number) {
    document.getElementById("continentSelectButton").style.backgroundColor = data.continentData[continentID].UIColor.secondary;
    document.getElementById("continentSelectButton").innerHTML = data.continentData[continentID].name + " " + data.continentData[continentID].warpgates[warpgateID].name;
    data.continentSelectedID = continentID;
    data.warpgateSelectedID = warpgateID;
    camera.setContinentSize(data.getCurrentContinent().mapBoxSize.x, data.getCurrentContinent().mapBoxSize.y);
    camera.centerCamOnWarpgate();
    mapRendering.updateSquadMarkerPositions();
}

/** Sets if the overlay is gonna ignore mouseevents or not */
function setWindowsFocus(isFocus: boolean) {
    FOCUS = isFocus;
    if (isFocus) {
        electronWindow.setIgnoreMouseEvents(false);
        document.getElementById("debugDisplay").style.backgroundColor = "green";
        document.getElementById("debugDisplay").innerText = "Focus";
    } else {
        if (!DEBUG) { electronWindow.setIgnoreMouseEvents(true, { forward: true }); }
        document.getElementById("debugDisplay").style.backgroundColor = "red";
        document.getElementById("debugDisplay").innerText = "Unfocused";
    }
}




export { addPlatoon, updateMapIfDragged, selectPosition, setWindowsFocus, setMapAsDragged, FOCUS }