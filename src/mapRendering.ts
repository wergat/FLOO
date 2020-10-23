import { coord, platoonHTMLElement, squadMarkerSizeSettings } from "./classes";
import data from "./data";
import camera from "./camera";
import { setWindowsFocus } from "./UIFunctions";
import { handleSquadMarkerEvent, makeSquadMarkerDragAble } from "./mouseEventHandler";


interface HTMLArrowElement extends HTMLElement {
    rotation: number;
}

let sizeSettings: squadMarkerSizeSettings[] = [
    { name: "normal", radius: 17, arrowDistance: 7 },
    { name: "small", radius: 12, arrowDistance: 5 },
    { name: "tiny", radius: 9, arrowDistance: 3 },
]

let settingSelected = 0;

const ARROW_COUNT = 6;

/** Enables or disables the rendering of stuff on the map as whole
 * usually off when tool "minimitzed" or setup not done yet
 */
let RENDER_MAP = true;


let cached_mapBoxSizeX = 0;
let cached_mapBoxSizeY = 0;

function disableRendering() {
    RENDER_MAP = false;
}

function enableRendering() {
    RENDER_MAP = true;
}

function SetPositionOnCircle(ele: HTMLArrowElement, size = 20) {
    let deg = (ele.rotation - 135) % 360;
    let rad = deg * (Math.PI / 180);
    let rel = { x: 10, y: 10 };
    ele.style.top = (Math.sin(rad) * size + rel.x) + "px";
    ele.style.left = (Math.cos(rad) * size + rel.y) + "px";
}

/** Rerenders all elements shown on the map itself
 * if forceSquads = true, forces all the squad markers to be updated even if they should not be rendered
 * all squad markers must rendered at least once, so this needs to get called at loadup
 */
function reRenderMapBody(forceSquads = false) {
    let mapBodyElement = document.getElementById("mapBody");

    if (document.getElementById("MapBoundsBox") == null) {
        let mapBoundsBox = document.createElement("div");
        mapBoundsBox.id = "MapBoundsBox";
        mapBodyElement.appendChild(mapBoundsBox);
    }

    let squadEle: HTMLDivElement;
    let letterDiv: HTMLDivElement;
    let squadMarkerArrowDiv: HTMLDivElement;
    let arrowEle: HTMLArrowElement;

    let selSettings = sizeSettings[settingSelected];

    // Build HTML Framework for squad markers
    for (let i = 0; i < data.getPlatoonCount(); i++) {
        for (let j = 0; j < 4; j++) {
            if (document.getElementById(`MarkerP${i}S${j}`) == null) {
                squadEle = document.createElement("div");
                squadEle.id = `MarkerP${i}S${j}`;
                squadEle.classList.add("squadMarker", "clickable");
                // The Letter
                letterDiv = document.createElement("div");
                letterDiv.classList.add("squadMarkerLetter", `squadMarkerLetter${data.getSquad(i, j).squadLetter}`);
                letterDiv.appendChild(document.createTextNode(data.getSquad(i, j).squadLetter));
                squadEle.appendChild(letterDiv);
                // Animation
                squadMarkerArrowDiv = document.createElement("div");
                for (let k = 0; k < ARROW_COUNT; k++) { // 6 Arrows
                    arrowEle = document.createElement("i") as HTMLArrowElement;
                    arrowEle.classList.add("arrow", "squadArrow");
                    arrowEle.id = `squadMarkerArrowP${i}S${j}A${k}`;
                    arrowEle.style.transform = `rotate(${k * (360 / ARROW_COUNT)}deg)`;
                    arrowEle.rotation = k * (360 / ARROW_COUNT);
                    SetPositionOnCircle(arrowEle, selSettings.radius + 7);
                    squadEle.appendChild(arrowEle);
                }
                squadEle.appendChild(squadMarkerArrowDiv);
                mapBodyElement.append(squadEle);
            }
        }
    }

    let ele: platoonHTMLElement;
    // Add Hooks to make Squad Markers Dragable
    for (let i = 0; i < data.getPlatoonCount(); i++) {
        for (let j = 0; j < 4; j++) {
            if (!data.getSquad(i, j).isEmpty || forceSquads) {
                ele = document.getElementById(`MarkerP${i}S${j}`) as platoonHTMLElement;
                // Add Information to keep track of this squad marker more easily within the document
                if (ele.platoon != i) {
                    makeSquadMarkerDragAble(ele);
                    // Add listeners so we can change window focus so they are interactable
                    ele.addEventListener('mouseleave', () => { setWindowsFocus(false); });
                    ele.addEventListener('mouseenter', () => { setWindowsFocus(true); });
                    ele.addEventListener('contextmenu', function (e) { handleSquadMarkerEvent(e); e.preventDefault(); }, false);
                }

                ele.platoon = i; ele.squad = j;
            }
        }
        updatePlatoonColor(i);
    }

    updateSquadMarkerPositions(forceSquads);
}

/** Updates the background and border color styles of all squad within a given platoon */
function updatePlatoonColor(platoonID: number) {
    let platoon = data.getPlatoon(platoonID);
    let darker = platoon.darkestColor;
    let normal = platoon.color;
    let brighter = platoon.lightestColor;

    for (let j = 0; j < 4; j++) {
        let SquadStyle = document.getElementById(`MarkerP${platoonID}S${j}`).style;
        SquadStyle.backgroundColor = normal;
        if (platoonID % 4 > 0) {
            let deg = 45 + platoonID * 70;
            let sizeA = 5 + ((platoonID * 3) % 7);
            let sizeB = 5 + ((platoonID * 4) % 7);
            SquadStyle.background = `repeating-linear-gradient(${deg}deg, ${brighter}, ${brighter} ${sizeA}px, ${normal} ${sizeB}px, ${normal} ${sizeA + sizeB}px)`;
        } else {
            SquadStyle.background = `repeating-radial-gradient(circle, ${brighter}, ${brighter} 10px, ${normal} 10px, ${normal} 20px)`;
        }

        SquadStyle.borderColor = darker
    }

}

function updateMapBoxSize() {
    cached_mapBoxSizeX = data.getCurrentContinent().mapBoxSize.x;
    cached_mapBoxSizeY = data.getCurrentContinent().mapBoxSize.y;
}

/** Updates Positions of Squad Markers and the Map Bounding Box */
function updateSquadMarkerPositions(force = false) {
    // Continent Bounding Box
    let ele = document.getElementById("MapBoundsBox");
    let xZoomFactor = camera.invZoomFactor;
    let yZoomFactor = camera.invZoomFactor;
    // Update style of bounding box
    ele.style.width = (xZoomFactor * cached_mapBoxSizeX) + "px";
    ele.style.height = (yZoomFactor * cached_mapBoxSizeY) + "px";
    let cameraOnMapPos: coord = camera.getCurrentPosition();
    if (RENDER_MAP) {
        ele.style.left = (xZoomFactor * (-cameraOnMapPos.x)) + "px";
        ele.style.top = (yZoomFactor * (-cameraOnMapPos.y)) + "px";
    } else {
        ele.style.left = "-200px";
        ele.style.top = "-200px";
    }


    // Platoon/Squad Positions
    for (var i = 0; i < data.getPlatoonCount(); i++) {
        for (var j = 0; j < 4; j++) {
            updateSquadMarker(i, j, force);
        }
    }
}

/** Removes squadmarkes from map
 * gets called when stuff gets deleted
 * just hides them
 */
function cleanUpSquadMarker(platoonID: number, squadID: number) {
    let ele = document.getElementById(`MarkerP${platoonID}S${squadID}`);
    if (ele == undefined) { 
        console.log(`WHAT THE FUCK MarkerP${platoonID}S${squadID} not found!`);
        return;
    }
    ele.style.left = "-100px";
    ele.style.top = "-100px";
}

/** Updates one single squad marker 
 * if force = true updates the squadmarker even if it was empty/"deleted" 
*/
function updateSquadMarker(platoonID: number, squadID: number, force = false) {
    let x = 0; let y = 0;
    // We only read the data here, no reason to save to disk if the squad is rendered or not
    let squadData = data.getSquad(platoonID, squadID);;
    let cameraOnMapPos: coord = camera.getCurrentPosition();
    let ele: HTMLElement;
    let factor = camera.invZoomFactor;

    let squadMarkerSize = sizeSettings[settingSelected].radius;

    if (!squadData.isEmpty || force) {
        ele = document.getElementById(`MarkerP${platoonID}S${squadID}`);
        if (ele == undefined) { console.log(`WHAT THE FUCK MarkerP${platoonID}S${squadID} not found!`) }
        x = (squadData.pos.x - cameraOnMapPos.x);
        y = (squadData.pos.y - cameraOnMapPos.y);
        // If Squad marker is on screen (and not deleted)
        if (!squadData.isEmpty && x >= 0 && x <= camera.mapRenderSize.x && y >= 0 && y <= camera.mapRenderSize.y) {
            squadData.isRendered = true;
            // Screen position of squad is dependend on zoom
            ele.style.left = (factor * x - squadMarkerSize) + "px";
            ele.style.top = (factor * y - squadMarkerSize) + "px";
            // Update squad animation
            updateSquadMarkerInPositionArrows(platoonID, squadID);
        } else {
            if (squadData.isRendered || force) {
                ele.style.left = "-100px";
                ele.style.top = "-100px";
                squadData.isRendered = false;
            }
        }
    }
}

/**
 * Updates the render of the inPosition arrows on the squad marker, but only if the current state and already rendered state are not the same
 * @param platoonID id of platoon
 * @param squadID if of squad
 */
function updateSquadMarkerInPositionArrows(platoonID: number, squadID: number) {
    let squadData = data.getSquad(platoonID, squadID);
    // We dont need to update the squad marker if the state didnt change
    if (squadData.isInPositionRenderedState == squadData.isInPosition) { return; }
    let arrowEle: HTMLElement;
    if (squadData.isInPosition) { // If squad in position, remove animation right now
        for (let i = 0; i < ARROW_COUNT; i++) {
            arrowEle = document.getElementById(`squadMarkerArrowP${platoonID}S${squadID}A${i}`);
            arrowEle.style.display = "none";
        }
    } else { // Otherwise add it to the queue to activate it later, but start the animation no as well just to react
        for (let i = 0; i < ARROW_COUNT; i++) {
            arrowEle = document.getElementById(`squadMarkerArrowP${platoonID}S${squadID}A${i}`);
            arrowEle.style.display = "inline-block";
        }
    }
}

export { reRenderMapBody, cleanUpSquadMarker, updatePlatoonColor, updateSquadMarkerPositions, updateSquadMarker, updateSquadMarkerInPositionArrows as updateSquadMarkerInPositionRender, updateMapBoxSize, disableRendering, enableRendering, RENDER_MAP }