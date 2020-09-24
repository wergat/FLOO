import * as color from 'color';
import camera from "./camera";
// Isnt there like a better way to do this?
import { coord, rect, Platoon, Squad, warpgate, continent, resolutionSettings, PlatoonHTMLElement, importContinentData, importResolutionSettings } from "./data";
const { ipcRenderer, remote } = require('electron');

// Genral Settings
let continentSelectedID = 0;
let warpgateSelectedID = 0;

/** Window object */
let electronWindow: Electron.BrowserWindow = remote.getCurrentWindow();

/** All the data about the platoons and squads */
let platoons: Platoon[] = [];

/** Data about the continents */
let continentData: continent[] = importContinentData(require("../ContinentData.json"));
/** Data for varios UI scaling etc when choosing different resolutions */
let resolutionData: resolutionSettings[] = importResolutionSettings(require("../resolutionSettings.json"));
/** Colors for each platoon. */
let PlatColors = [color("#416ACC"), color("#47CCB5"), color("#4FCC3D"), color("#CCBF33"), color("#CC8B2F")];
/** Debug mode on/off? */
let DEBUG = false;


let canDragMap = false;
/** We are updating the map when dragging only FPS/s often, so we safe if we dragged the map since last rendered frame */
let didDragMap = false;
/** Update the map only every x ms  */
let DEBUGDidUpdateMouseBox = false;
let mousePos = {x: 0, y: 0};

/** Mouse position on map space when map drag starts */
let dragStartPosition: coord = { x: 0, y: 0 };
/** Total screenspace mouse drag movement, reset on mouseup */
let dragMovement: coord = { x: 0, y: 0 };
/** Screenspace position of dragging mouse last event */
let lastDragPosition: coord = { x: 0, y: 0 };
/** So we know where the MAPSPACE camera pos is compared to dragStartPosition */
let relativeCamPositionToDragStart: coord = { x: 0, y: 0 };
/** Is the mouse currently on a interactable UI element? (Or is the window focused right now) */
let FOCUS = true;
/** Currently Dragging an element? */
let IsDraggingElement = false;



/** Is the custom context menu open right now */
let contextMenuOpen = false;


/** 0 = "2560x1377" */
let resolutionSelected: number = 0;
/** Border size of the Map Bounds Box */
let mapBoundsBoxBorderSize = 5;
/** (Half the) Size of the Squad marker in pixels */
let squadMarkerSize = 17;

let mousePosBox = document.getElementById("MousePosBox");

/** Platoon Box on the left that is currently opened -1 := none opend */
let OpenedPlatoonBox = -1;

/** Rerenders all elements shown on the map itself */
function ReRenderMapBody() {
    let str = "<div id='MapBoundsBox'></div>";
    let ele: PlatoonHTMLElement;
    // Build HTML Framework for squad markers
    for (var i = 0; i < platoons.length; i++) {
        for (var j = 0; j < 4; j++) {
            if (!platoons[i].squads[j].isEmpty) {
                str += "<div id='MarkerP" + i + "S" + j + "' class='squadMarker clickable'> <div class='squadMarkerLetter squadMarkerLetter" + platoons[i].squads[j].squadLetter + "'>" + platoons[i].squads[j].squadLetter + "</div> </div> <br>";
            }
        }
    }
    document.getElementById("mapBody").innerHTML = str;

    // Add Hooks to make Squad Markers Dragable
    for (var i = 0; i < platoons.length; i++) {
        for (var j = 0; j < 4; j++) {
            if (!platoons[i].squads[j].isEmpty) {
                let str = "MarkerP" + i + "S" + j
                ele = document.getElementById(str) as PlatoonHTMLElement;
                // Add Information to keep track of this squad marker more easily within the document
                ele.platoon = i; ele.squad = j;
                MakeSquadMarkerDragAble(ele);
                // Add listeners so we can change window focus so they are interactable
                ele.addEventListener('mouseleave', () => { SetWindowsFocus(false); });
                ele.addEventListener('mouseenter', () => { SetWindowsFocus(true); });
                ele.addEventListener('contextmenu', function (e) { handleContextMenu(str); e.preventDefault(); }, false);
                ele.addEventListener('click', function (e) { handleSquadClick(str); }, false);

                var SquadStyle = ele.style;
                SquadStyle.backgroundColor = platoons[i].color.toString();
                SquadStyle.borderColor = platoons[i].borderColor.toString();
            }
        }
    }

    UpdateSquadMarkerPositions();
}

/** Queues an update to the mouse debug box */
function updateMouseDebugBox(mouse: any) {
    mousePos = {x: mouse.x, y: mouse.y}
    DEBUGDidUpdateMouseBox = true;
}

/** Gets called every few ms to check if the deubg box needs an update */
function updateDebugIfNeeded(){
    if(DEBUGDidUpdateMouseBox){
        updateMouseDebugBoxHTML()
        DEBUGDidUpdateMouseBox = false;
    }
}

/** Actually updates the html of the mouse debug box */
function updateMouseDebugBoxHTML(){
    mousePosBox.innerHTML = "Mouse Screen @ [" + mousePos.x + "|" + mousePos.y + "]<br>" +
    "Mouse Map @ [" + (camera.onMapPos.x + camera.zoomFactor * mousePos.x).toFixed(2) + "|" + (camera.onMapPos.y + camera.zoomFactor * mousePos.y).toFixed(2) + "] <br>" +
    "MapEdge @ [" + (camera.onMapPos.x).toFixed(2) + "|" + (camera.onMapPos.y).toFixed(2) + "] <br>" +
    "Zoom Level " + camera.zoomFactor + " [" + camera.currentZoomLevel + "] @ [" + (camera.mapRenderSize.x).toFixed(0) + "x" + (camera.mapRenderSize.y).toFixed(0) + "] <br>" +
    "Drag @ [" + (dragStartPosition.x).toFixed(2) + "|" + (dragStartPosition.y).toFixed(2) + "] -> [" + (dragMovement.x).toFixed(2) + "|" + (dragMovement.y).toFixed(2) + "]";
}

/** Updates Positions of Squad Markers and the Map Bounding Box */
function UpdateSquadMarkerPositions() {
    // Add Style
    // Continent Bounding Box
    let ele = document.getElementById("MapBoundsBox");
    let factor = camera.invZoomFactor;
    let x = camera.invZoomFactor;
    let y = camera.invZoomFactor;

    ele.style.width = (x * continentData[continentSelectedID].mapBoxSize.x - mapBoundsBoxBorderSize * 2) + "px";
    ele.style.height = (y * continentData[continentSelectedID].mapBoxSize.y - mapBoundsBoxBorderSize * 2) + "px";
    let cameraOnMapPos: coord = camera.getCurrentPositionOnMap();
    ele.style.left = (x * (-cameraOnMapPos.x)) + "px";
    ele.style.top = (y * (-cameraOnMapPos.y)) + "px";

    // Platoon/Squad Positions
    x = 0; y = 0;
    for (var i = 0; i < platoons.length; i++) {
        for (var j = 0; j < 4; j++) {
            if (!platoons[i].squads[j].isEmpty) {
                ele = document.getElementById("MarkerP" + i + "S" + j);
                x = (platoons[i].squads[j].pos.x - cameraOnMapPos.x);
                y = (platoons[i].squads[j].pos.y - cameraOnMapPos.y);
                if (x >= 0 && x <= camera.mapRenderSize.x && y >= 0 && y <= camera.mapRenderSize.y) {
                    platoons[i].squads[j].isRendered = true;
                    // Screen position of squad is dependend on zoom
                    ele.style.left = (factor * x - squadMarkerSize) + "px";
                    ele.style.top = (factor * y - squadMarkerSize) + "px";
                } else {
                    if (platoons[i].squads[j].isRendered) {
                        ele.style.left = "-100px";
                        ele.style.top = "-100px";
                    }
                }
            }
        }
    }
}


/** Sets if the overlay is gonna ignore mouseevents or not */
function SetWindowsFocus(isFocus: boolean) {
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


function handleMouseEvent(message: any) {
    var type = message.type;
    switch (type) {
        case 'mousedrag':
            handleMapDrag({ x: message.x, y: message.y });
            updateMouseDebugBox(message);
            break;
        case 'mouseup':
            if (message.button == 1) {
                canDragMap = false; // Cant drag map if mouse isnt held down
            }
            updateMouseDebugBox(message);
            break;
        case 'mousedown':
            // Left Click
            if (message.button == 1) {
                // Reset all drag coordinates and tracked vectors etc
                dragStartPosition = { x: camera.zoomFactor * message.x, y: camera.zoomFactor * message.y };
                relativeCamPositionToDragStart = { x: camera.onMapPos.x - dragStartPosition.x, y: camera.onMapPos.y - dragStartPosition.y };
                lastDragPosition = { x: message.x, y: message.y };
                dragMovement = { x: 0, y: 0 };

                // If we are hovering over the map and are not dragging something around right now, drag the map if we drag the mouse around TODO: Add actual area for map to be checked against, so you dont drag stuff from offscreen
                if (FOCUS == false && !IsDraggingElement) {
                    canDragMap = true;
                }

                // Close the context menu if it is open right now
                if (contextMenuOpen) {
                    closeContextWindow();
                }
            }

            updateMouseDebugBox(message);
            break;
        case 'mousemove':
            updateMouseDebugBox(message);
            break;
        case 'mousewheel':
            handleMouseWheel(message);
            updateMouseDebugBox(message);
            break
        default:
            console.log(message);
            break;
    }
}

/** Handles the map and camera positions when the camera gets dragged around */
function handleMapDrag(newPos: coord) {
    // Dont trag if we can't drag
    if (!canDragMap) { return; }

    // Calculate the camera movement based on camera render size (zoom) and drag delta
    let dX = camera.zoomFactor * (lastDragPosition.x - newPos.x);
    let dY = camera.zoomFactor * (lastDragPosition.y - newPos.y);

    // Summing the total distance moved from the start position
    dragMovement.x += dX; dragMovement.y += dY;

    camera.onMapPos.x = dragStartPosition.x + dragMovement.x + relativeCamPositionToDragStart.x;
    camera.onMapPos.y = dragStartPosition.y + dragMovement.y + relativeCamPositionToDragStart.y;

    // Clamp the real camera so we can only look at one continent at a time ;)
    camera.ClampCameraPosition();

    // Update position of last drag so we know how far we dragged the next time around
    lastDragPosition = { x: newPos.x, y: newPos.y };
    didDragMap = true;
}

/** Handles the rendering when the camera gets dragged around
 * gets called every FPS/s, so we dont update the render too often
 */
function updateMapIfDragged() {
    if (didDragMap) {
        // Update all squad markers with updated camera position
        UpdateSquadMarkerPositions();
        didDragMap = false;
    }
}



/** Opens the Context Menu for an element */
function handleContextMenu(elementStrID: string) {
    contextMenuOpen = true;
    const relativePos = { x: 30, y: 0 };
    let ele = document.getElementById(elementStrID) as PlatoonHTMLElement;
    let i = ele.platoon; let j = ele.squad;
    let menuEle = document.getElementById("contextMenu")
    menuEle.style.left = (camera.invZoomFactor * (platoons[i].squads[j].pos.x - camera.onMapPos.x) - squadMarkerSize + relativePos.x) + "px";
    menuEle.style.top = (camera.invZoomFactor * (platoons[i].squads[j].pos.y - camera.onMapPos.y) - squadMarkerSize + relativePos.y) + "px";
    menuEle.style.height = "200px";
}

/** Handles a simple click on a squad
 * onclick, a squad should start flickering or similar, signaling that it has not arrived at its location yet
 * another cllick should update a squad, singaling arrival 
 */
function handleSquadClick(elementStrID: string) {
    let ele = document.getElementById(elementStrID) as PlatoonHTMLElement;
    let i = ele.platoon; let j = ele.squad;
    //let inPosition = !Platoons[i].squads[j].isInPosition;
}

/** Closes the Context Window again with animation, then removes it from the screen after .05s */
function closeContextWindow() {
    let menuEle = document.getElementById("contextMenu")

    menuEle.style.height = "0px";
    contextMenuOpen = false;

    setTimeout(function () { menuEle.style.left = "-1000px"; menuEle.style.top = "-1000px"; }, 50);
}

/** Rerenders everything in the left UI Box */
function RerenderLeftBox() {
    RerenderPlatoonBox();
    RerenderContinentSelectButtons();
}

/** Re-renders the continent select button */
function RerenderContinentSelectButtons() {
    let dropdownElement = document.getElementById("continentSelectDropdown");
    let str = "";

    var contID = 0;
    for (var continent of continentData) {
        str += "<div class='dropdownWarpgate'>" +
            "<button class='warpgateSelectButton' id='continentSelectButton" + continent.name + "'>" + continent.name + "</button>" +
            "<div class='dropdownWarpgate-content' id='warpgateSelectDropdown'>";
        var WGID = 0;
        for (var warpgate of continent.warpgates) {
            str += "<a id='selectC" + contID + "WG" + WGID + "'>" + warpgate.name + "</a>";
            WGID++;
        }
        str += "</div></div>";
        contID++;
    }
    dropdownElement.innerHTML = str;

    // Apply dynamic style changes
    var contID = 0;
    for (var continent of continentData) {
        let ele = document.getElementById("continentSelectButton" + continent.name);
        ele.style.backgroundColor = continent.UIColor.secondary;
        var WGID = 0;
        for (var warpgate of continent.warpgates) {
            let a = contID; let b = WGID; // Temp vars because js doesnt know how to not handle reference type variables
            document.getElementById("selectC" + contID + "WG" + WGID).addEventListener('click', function () { selectPosition(a, b); });
            WGID++;
        }
        contID++;
    }
}




function RerenderPlatoonBox() {
    let str = "";
    for (var i = 0; i < platoons.length; i++) {
        str += "<div id='platoon" + i + "' class='platoonListEntry'><div class='platoonListID' id='platoonListID" + i + "'>Platoon " + i + " <div><i class='arrow down' id='platoon" + i + "Arrow'></i></div> </div>" +
            "<div class='squadList'>";
        for (var j = 0; j < 4; j++) {
            str += "<div class='squadListEntry' id='squadListEntryP" + i + "S" + j + "'><div class='squadListEntryLetter'><a>" + Squad.validLetters[j] +
                "</a></div> <div class='squadListEntryName' contenteditable='true' id='squadListNameP" + i + "S" + j + "'>" + platoons[i].squads[j].name +
                "</div></div>";
        }


        str += "</div></div>";
    }
    document.getElementById("PlatoonBox").innerHTML = str;

    for (var i = 0; i < platoons.length; i++) {
        document.getElementById("platoon" + i).style.backgroundColor = platoons[i].color.toString();
        let a = i;
        document.getElementById("platoonListID" + i).addEventListener('click', function () { extendPlatoonList(a); });
        for (var j = 0; j < 4; j++) {
            let b = j;
            document.getElementById("squadListNameP" + a + "S" + b).addEventListener("input", function () { platoons[a].squads[b].name = document.getElementById("squadListNameP" + a + "S" + b).innerText; }, false);
            document.getElementById("squadListEntryP" + i + "S" + j).style.float = (j % 2 == 0) ? "left" : "right";
        }
    }
}

/** Opens/extends the tab of Platoon pID to show more detail/options */
function extendPlatoonList(pID: number) {
    if (OpenedPlatoonBox >= 0) {
        document.getElementById("platoon" + OpenedPlatoonBox).style.height = "72px";
        document.getElementById("platoon" + OpenedPlatoonBox + "Arrow").classList.add('down');
        document.getElementById("platoon" + OpenedPlatoonBox + "Arrow").classList.remove('up');
    }
    if (OpenedPlatoonBox != pID) {
        document.getElementById("platoon" + pID).style.height = "200px";
        document.getElementById("platoon" + pID + "Arrow").classList.add('up');
        document.getElementById("platoon" + pID + "Arrow").classList.remove('down');
        OpenedPlatoonBox = pID;
    } else {
        OpenedPlatoonBox = -1;
    }
}

/** Selects the continentID and warpgateID 
 * TODO: Update camera continent size
*/
function selectPosition(continentID: number, warpgateID: number) {
    document.getElementById("continentSelectButton").style.backgroundColor = continentData[continentID].UIColor.secondary;
    document.getElementById("continentSelectButton").innerHTML = continentData[continentID].name + " " + continentData[continentID].warpgates[warpgateID].name;
    continentSelectedID = continentID;
    warpgateSelectedID = warpgateID;
    camera.setContinentSize(continentData[continentSelectedID].mapBoxSize.x,continentData[continentSelectedID].mapBoxSize.y);
    CenterCamOnWarpgate();
}


function CenterCamOnWarpgate() {
    camera.centerMapOnPosition(continentData[continentSelectedID].warpgates[warpgateSelectedID].x,
        continentData[continentSelectedID].warpgates[warpgateSelectedID].y);
    camera.ClampCameraPosition();
    // Rerender Map
    UpdateSquadMarkerPositions();
}

/** Adds one platoon of filled squads near the warpgate. Rerenders everything afterwards */
function addPlatoon() {
    let platoonNumber = platoons.length;
    let ptColor = PlatColors[platoonNumber];
    if (platoonNumber >= PlatColors.length) { ptColor = color.rgb(Math.random() * 255, Math.random() * 255, Math.random() * 255); }
    let pt = new Platoon(ptColor);
    // Add 4 empty squads first to push the platoon into the list
    pt.squads = [new Squad(platoonNumber, "a", { x: 0, y: 0 }), new Squad(platoonNumber, "b", { x: 0, y: 0 }), new Squad(platoonNumber, "c", { x: 0, y: 0 }), new Squad(platoonNumber, "d", { x: 0, y: 0 })];
    platoons.push(pt);
    // Now fill the squads and spawn them near the warpgate one after another so they dont intersect
    let pos;
    for (var i = 0; i < 4; i++) {
        pos = getFreePositionNearWarpgate();
        platoons[platoonNumber].squads[i].isEmpty = false;
        platoons[platoonNumber].squads[i].pos.x = pos.x;
        platoons[platoonNumber].squads[i].pos.y = pos.y;
    }


    RerenderPlatoonBox();
    ReRenderMapBody();
}

/** Makes an element (squadmarker) dragable by adding mouse events to the squad marker*/
function MakeSquadMarkerDragAble(squadMarker: PlatoonHTMLElement) {
    var deltaMove = { x: 0, y: 0 };
    var lastPos = { x: 0, y: 0 };
    squadMarker.onmousedown = dragMouseDown;

    function dragMouseDown(e: any) {
        e.preventDefault();

        // Get the position on mouse down
        lastPos.x = e.clientX;
        lastPos.y = e.clientY;

        // Capture mouseup and mouse move events for the whole document while we are at it.
        document.onmouseup = endElementDrag;
        document.onmousemove = elementDrag;

        // Lets start dragging this element, not the map.
        IsDraggingElement = true;
    }

    function elementDrag(e: any) {
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
        platoons[squadMarker.platoon].squads[squadMarker.squad].pos.x = camera.zoomFactor * (squadMarker.offsetLeft - deltaMove.x + squadMarkerSize) + camera.onMapPos.x;
        platoons[squadMarker.platoon].squads[squadMarker.squad].pos.y = camera.zoomFactor * (squadMarker.offsetTop - deltaMove.y + squadMarkerSize) + camera.onMapPos.y;
        // We aint dragging anymore, free up the map movement
        IsDraggingElement = false;
        // Update the positions of all markers, just to be safe??? How about no?
        //UpdateSquadMarkerPositions();
    }
}


/** Handles the mousewheel on zoom in/out */
function handleMouseWheel(message: any) {
    camera.handleMouseWheel(message);
    camera.ClampCameraPosition();
    // Clamp Camera Position in case we scrolled out of bounds somehow

    UpdateSquadMarkerPositions();
}

/** Returns a random position near the warpgate that is not near any other squad marker right now */
function getFreePositionNearWarpgate() {
    let WGData = continentData[continentSelectedID].warpgates[warpgateSelectedID];
    let WGPos = { x: WGData.x, y: WGData.y };
    // Range of wich no other squad is allowed to be
    const FreeRadius = 150;
    let range = 5;

    let tempPos = { x: 0, y: 0 };
    let squad;
    let foundFreeSpace = false;

    let b = -4;

    while (!foundFreeSpace) {
        foundFreeSpace = true;
        //tempPos = {x: Math.floor(Math.random() * range - range / 2) + WGPos.x, y: Math.floor(Math.random() * range - range / 2) + WGPos.y};
        tempPos = { x: WGPos.x + b * range * Math.cos(range / 10), y: WGPos.y + b * range * Math.sin(range / 10) };
        for (var i = 0; i < platoons.length; i++) {
            for (var j = 0; j < 4; j++) {
                squad = platoons[i].squads[j];
                if (!squad.isEmpty) {
                    let dist = Math.hypot(squad.pos.x - tempPos.x, squad.pos.y - tempPos.y);
                    if (dist < FreeRadius) {
                        foundFreeSpace = false;
                    }
                }
            }
        }
        range = 1.01 * range + 5;
    }
    return tempPos;
}

// Fill the camera with information
// Update Camera ScreenSize and Window Size
camera.setMapRenderSize(electronWindow.getSize()[0], electronWindow.getSize()[1]);
camera.setWindowSize(electronWindow.getSize()[0], electronWindow.getSize()[1]);
camera.setScreenSpaceCorners(resolutionData[0].mapBoundingBox);
console.log(resolutionData);
camera.setContinentSize(continentData[continentSelectedID].mapBoxSize.x,continentData[continentSelectedID].mapBoxSize.y);
console.log(camera.mapSpaceCorners);




ipcRenderer.on('MouseEvent', (event, message) => {
    handleMouseEvent(message);
});

// Set framrate for drag updates to 60FPS for better performance when dragging stuff around
window.setInterval(function () {
    updateMapIfDragged();
    updateDebugIfNeeded();
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
    el.addEventListener('mouseleave', () => { SetWindowsFocus(false); });
    el.addEventListener('mouseenter', () => { SetWindowsFocus(true); });
});

//SetWindowsFocus(true);

// Updating HTML based on loaded data
ReRenderMapBody();
RerenderLeftBox();