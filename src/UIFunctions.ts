import { platoon, squad, platoonHTMLElement, coord } from "./classes"
import data from "./data";
import camera from "./camera";
import * as mapRendering from "./mapRendering";
import * as Color from 'color';
let electronWindow: Electron.BrowserWindow = require('electron').remote.getCurrentWindow();
const Vue = require("../AAA/vue.js");

const FOCUS = new Vue({ data() { return { value: true } } });

/** We are updating the map when dragging only FPS/s often, so we safe if we dragged the map since last rendered frame */
let didDragMap: boolean;



/** Is the mouse currently on a interactable UI element? (Or is the window focused right now) */


/** Debug mode on/off? */
const DEBUG = false;

/** Adds one platoon of filled squads near the warpgate. Rerenders everything afterwards */
function addPlatoon() {
    let platoonNumber = data.getPlatoonCount();
    let ptColor: Color;
    // Get color from plat color array
    if (platoonNumber < data.platColors.length) {
        ptColor = data.platColors[platoonNumber];
    } else {// JuST iNvENt soMe nEW cOLeR if we run out of preset options
        let hue = 0;
        let freedom = 60;
        let found = false;
        let compareHue = 0;
        let distance = 0;
        while (!found) {
            found = true;
            hue = Math.random() * 360;
            freedom--;
            for (let i = 0; i < platoonNumber; i++) {
                compareHue = Color(data.getPlatoon(i).color).hue();
                distance = Math.abs((hue - compareHue + 180 + 360) % 360 - 180);
                if (distance < freedom) {
                    found = false;
                    break;
                }
            }

        }
        console.log(`Freedom of angle: ${freedom}`);
        ptColor = Color(`hsl(${hue},${50 + Math.random() * 15 * Math.random() * 15}%,${40 + Math.random() * 20 + Math.random() * 10}%)`);
    }

    let pt = new platoon();
    setPlatoonColor(pt, ptColor);

    // Add 4 empty squads first to push the platoon into the list
    pt.squads = [new squad(platoonNumber, "a", { x: 0, y: 0 }), new squad(platoonNumber, "b", { x: 0, y: 0 }), new squad(platoonNumber, "c", { x: 0, y: 0 }), new squad(platoonNumber, "d", { x: 0, y: 0 })];
    data.vuePlatoonsObject.value.push(pt);

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

    mapRendering.reRenderMapBody();
}

function setPlatoonColor(platoon: platoon, color: Color) {
    platoon.lightestColor = color.lighten(0.5).toString();
    platoon.lightColor = color.lighten(0.25).toString();
    platoon.color = color.toString();
    platoon.darkColor = color.darken(0.25).toString();
    platoon.darkestColor = color.darken(0.5).toString();
}


/** TODO: Fix removed platoons still rendering */
function removePlatoon(platoonID: number) {
    // Set all squad to not render them
    for (let i = 0; i < 4; i++) {
        let squad = data.getSquad(platoonID, i);
        squad.isEmpty = true;
        data.setSquad(platoonID, i, squad);
    }
    // Render them as not being there
    for (let i = 0; i < 4; i++) {
        mapRendering.updateSquadMarker(platoonID, i, true);
    }

    // Actually remove them, now that they are not being rendered anymore
    data.removePlatoon(platoonID);

    // Clean up abbandoned squad markers
    for (let i = 0; i < 4; i++) {
        mapRendering.cleanUpSquadMarker(data.getPlatoonCount(), i);
    }

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
        mapRendering.updateMapMarkerPositions();
        didDragMap = false;
    }
}

/** Sets if the overlay is gonna ignore mouseevents or not */
function setWindowsFocus(isFocus: boolean) {
    FOCUS.value = isFocus;
    if (isFocus) {
        electronWindow.setIgnoreMouseEvents(false);
    } else {
        if (!DEBUG) { electronWindow.setIgnoreMouseEvents(true, { forward: true }); }
    }
}

/** Sets the delted state of a squad marker
 * TODO: Maybe move this and setSquadMarkerMovingState into one function?
 * @param platoonID platoonID of squad marker
 * @param squadID squadID of squad marker
 * @param toggle toggle the squad marker? if toggle is false, squad marker gets set to [value = true] instead
 * @param value if true squad gets marked as deleted, false = not delted
 */
function setSquadMarkerDeletedState(platoonID: number, squadID: number, toggle = true, value = true) {
    // Get the squad data
    let squadData = data.getSquad(platoonID, squadID);

    if (toggle) {
        squadData.isEmpty = !squadData.isEmpty;
    } else {
        squadData.isEmpty = value;
    }

    // Save Data
    data.setSquad(platoonID, squadID, squadData);
    // Force Map Rendering update because squad was potentially deleted
    mapRendering.updateSquadMarker(platoonID, squadID, true);
}

/** Sets the moving state of a squad marker
 * TODO: Maybe move this and setSquadMarkerDeletedState into one function?
 * @param platoonID platoonID of squad marker
 * @param squadID squadID of squad marker
 * @param toggle toggle the squad marker? if toggle is false, squad marker gets set to [value = true] instead
 * @param value if true squad gets marked as moving, false = not moving
 */
function setSquadMarkerMovingState(platoonID: number, squadID: number, toggle = true, value = true) {
    // Get the squad data
    let squadData = data.getSquad(platoonID, squadID);

    if (toggle) {
        squadData.isInPosition = !squadData.isInPosition;
    } else {
        squadData.isInPosition = value;
    }

    // Save Data
    data.setSquad(platoonID, squadID, squadData);
    // Update the animation toggle for this squad only
    mapRendering.updateSquadMarkerInPositionRender(platoonID, squadID);
}

/** Restarts the rendering after updating all the needed information for camera etc. */
function restartRendering() {
    // set new vars for camera and bounding box
    camera.setScreenSpaceCorners(data.vueResolutionObject.value[data.resolutionSelectedID].mapBoundingBox);
    camera.setContinentSize(data.getCurrentContinent().mapBoxSize.x, data.getCurrentContinent().mapBoxSize.y);
    camera.resolutionScaleFactor = data.vueResolutionObject.value[data.resolutionSelectedID].resolutionScale;

    mapRendering.updateMapBoxSize();

    // Enable rendering again
    mapRendering.enableRendering();
    // Re-Render everything to make sure every squadmarker has an element, etc.
    mapRendering.reRenderMapBody(true);

    // Center camera on new warpgate position
    camera.centerCamOnWarpgate();
    // Update squadmarker positions related to new warpgate position
    mapRendering.updateSquadMarkerPositions();
}

export {
    addPlatoon, setPlatoonColor, removePlatoon, restartRendering,
    updateMapIfDragged, setWindowsFocus, setMapAsDragged,
    setSquadMarkerDeletedState, setSquadMarkerMovingState,
    FOCUS
}