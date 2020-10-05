import { Platoon, Squad, PlatoonHTMLElement } from "./classes"
import data from "./data";
import camera from "./camera";
import * as mapRendering from "./mapRendering";
import * as color from 'color';
import * as UIRendering from "./UIRendering";
let electronWindow: Electron.BrowserWindow = require('electron').remote.getCurrentWindow();


/** (Half the) Size of the Squad marker in pixels */
let squadMarkerSize = 17;

/** We are updating the map when dragging only FPS/s often, so we safe if we dragged the map since last rendered frame */
let didDragMap: boolean;


/** Is the mouse currently on a interactable UI element? (Or is the window focused right now) */
let FOCUS = true;


/** Debug mode on/off? */
let DEBUG = false;

/** Adds one platoon of filled squads near the warpgate. Rerenders everything afterwards */
function addPlatoon() {
    let platoonNumber = data.getPlatoonCount();
    let ptColor = data.platColors[platoonNumber];
    if (platoonNumber >= data.platColors.length) { ptColor = color.rgb(Math.random() * 255, Math.random() * 255, Math.random() * 255); }
    let pt = new Platoon(ptColor);
    // Add 4 empty squads first to push the platoon into the list
    pt.squads = [new Squad(platoonNumber, "a", { x: 0, y: 0 }), new Squad(platoonNumber, "b", { x: 0, y: 0 }), new Squad(platoonNumber, "c", { x: 0, y: 0 }), new Squad(platoonNumber, "d", { x: 0, y: 0 })];
    data.platoons.push(pt);

    // Now fill the squads and spawn them near the warpgate one after another so they dont intersect
    // Full One squad at a time so the squads dont overlap
    let pos;
    for (var i = 0; i < 4; i++) {
        pos = data.getFreePositionNearWarpgate();
        data.platoons[platoonNumber].squads[i].isEmpty = false;
        data.platoons[platoonNumber].squads[i].pos.x = pos.x;
        data.platoons[platoonNumber].squads[i].pos.y = pos.y;
    }



    UIRendering.reRenderPlatoonBox();
    mapRendering.reRenderMapBody();
}

/** Makes an element (squadmarker) dragable by adding mouse events to the squad marker*/
function makeSquadMarkerDragAble(squadMarker: PlatoonHTMLElement) {
    let deltaMove = { x: 0, y: 0 };
    let lastPos = { x: 0, y: 0 };
    squadMarker.onmousedown = dragMouseDown;
    let IsDraggingElement = false;

    function dragMouseDown(e: MouseEvent) {
        e.preventDefault();
        // Only allow moving squad with left click
        if(e.button != 0){return;}

        // Get the position on mouse down
        lastPos.x = e.clientX;
        lastPos.y = e.clientY;

        // Capture mouseup and mouse move events for the whole document while we are at it.
        document.onmouseup = endElementDrag;
        document.onmousemove = elementDrag;

        // Lets start dragging this element, not the map.
        IsDraggingElement = true;
    }

    function elementDrag(e: MouseEvent) {
        e.preventDefault();

        // Calculate Distance moved
        deltaMove.x = lastPos.x - e.clientX;
        deltaMove.y = lastPos.y - e.clientY;
        lastPos.x = e.clientX;
        lastPos.y = e.clientY;

        // Update Element position
        squadMarker.style.left = (squadMarker.offsetLeft - deltaMove.x) + "px";
        squadMarker.style.top = (squadMarker.offsetTop - deltaMove.y) + "px";
    }

    function endElementDrag() {
        // Release the mouseup/mouse move events
        document.onmouseup = null;
        document.onmousemove = null;

        // Update the position to the saved data to make sure the position stays fixed when map gets moved/zoomed in
        data.getSquad(squadMarker.platoon, squadMarker.squad).pos.x = camera.zoomFactor * (squadMarker.offsetLeft - deltaMove.x + squadMarkerSize) + camera.onMapPos.x;
        data.getSquad(squadMarker.platoon, squadMarker.squad).pos.y = camera.zoomFactor * (squadMarker.offsetTop - deltaMove.y + squadMarkerSize) + camera.onMapPos.y;
        // We aint dragging anymore, free up the map movement
        IsDraggingElement = false;
        // Update the positions of all markers, just to be safe??? How about no?
        //UpdateSquadMarkerPositions();
    }
}

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


export { addPlatoon, makeSquadMarkerDragAble, updateMapIfDragged, selectPosition, setWindowsFocus, setMapAsDragged, FOCUS }