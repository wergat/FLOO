import { coord, platoonHTMLElement, squad } from "./classes"
import camera from "./camera";
import * as UI from "./UI";
import * as UIRendering from "./UIRendering";
import * as mapRendering from "./mapRendering";
import { setMapAsDragged, FOCUS } from "./UIFunctions";
import data from "./data";
import { eventNames } from "iohook";


/** (Half the) Size of the Squad marker in pixels */
let squadMarkerSize = 17;

/**TODO:  ??? */
let canDragMap: boolean;

/** Screenspace position of dragging mouse last event */
let lastDragPosition: coord = { x: 0, y: 0 };
/** So we know where the MAPSPACE camera pos is compared to dragStartPosition */
let relativeCamPositionToDragStart: coord = { x: 0, y: 0 };

/** Mouse position on map space when map drag starts */
let dragStartPosition: coord = { x: 0, y: 0 };
/** Total screenspace mouse drag movement, reset on mouseup */
let dragMovement: coord = { x: 0, y: 0 };

/** TODO: ??? */
let mousePos = { x: 0, y: 0 };

/** [PlatoonID,SquadID] of squadmarker for context menu */
let contextMenuSelected: [number, number] = [-1, -1];

let contextMenuOpen = false;

/** Handles Mouse Events coming from renderer thread.
 * 
 * Used to track mouse when the game is focused instead of the UI tools
 */
function handleRendererMouseEvent(message: any) {
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
                if (FOCUS == false) {
                    canDragMap = true;
                    // Close the context menu if it is open right now
                    if (contextMenuOpen) {
                        closeContextMenu()
                    }
                }


            }
            console.log(message.activeWindow);
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
    camera.clampCameraPosition();

    // Update position of last drag so we know how far we dragged the next time around
    lastDragPosition = { x: newPos.x, y: newPos.y };
    setMapAsDragged();
}

/** Queues an update to the mouse debug box */
function updateMouseDebugBox(mouse: any) {
    mousePos = { x: mouse.x, y: mouse.y }
    UI.flagMouseBoxUpdate();
}

/** Handles the mousewheel on zoom in/out */
function handleMouseWheel(message: any) {
    // Update the camera when we zoom. Update the other stuff only if zoom actually changed
    if (camera.handleMouseWheel(message)) {
        // Clamp Camera Position in case we scrolled out of bounds somehow
        camera.clampCameraPosition();
        // Update squad marker position
        mapRendering.updateSquadMarkerPositions();
        // Update the UI
        UI.updateZoomLevel();
    }
}


/** Makes an element (squadmarker) dragable by adding mouse events to the squad marker*/
function makeSquadMarkerDragAble(squadMarker: platoonHTMLElement) {
    let deltaMove = { x: 0, y: 0 };
    let lastPos = { x: 0, y: 0 };
    let startPos = { x: 0, y: 0 }
    squadMarker.onmousedown = startElementDrag;
    let isDraggingThisElement = false;

    function startElementDrag(e: MouseEvent) {
        e.preventDefault();
        // Only allow moving squad with left click
        if (e.button != 0) { return; }

        // Get the position on mouse down
        lastPos = { x: e.clientX, y: e.clientY };
        startPos = { x: e.clientX, y: e.clientY };

        // Capture mouseup and mouse move events for the whole document while we are at it.
        document.onmouseup = endElementDrag;
        document.onmousemove = elementDrag;

        // Lets start dragging this element, not the map.
        isDraggingThisElement = true;

        // Close context menu if it is open
        if (contextMenuOpen) {
            closeContextMenu()

        }
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

    function endElementDrag(event: MouseEvent) {
        deltaMove = { x: 0, y: 0 };
        event.preventDefault();
        // Release the mouseup/mouse move events
        document.onmouseup = null;
        document.onmousemove = null;

        // Update the position to the saved data to make sure the position stays fixed when map gets moved/zoomed in
        data.getSquad(squadMarker.platoon, squadMarker.squad).pos.x = camera.zoomFactor * (squadMarker.offsetLeft - deltaMove.x + squadMarkerSize) + camera.onMapPos.x;
        data.getSquad(squadMarker.platoon, squadMarker.squad).pos.y = camera.zoomFactor * (squadMarker.offsetTop - deltaMove.y + squadMarkerSize) + camera.onMapPos.y;
        // We aint dragging anymore, free up the map movement
        isDraggingThisElement = false;
        // Check if we dragged it all. If we didnt drag, then it was a click instead, so handle the event as a click instead
        if (lastPos.x - startPos.x == 0 && lastPos.y - startPos.y == 0) {
            handleSquadMarkerClick(event);
        } else {
            // If shift is pressed, set the squad marker to inPosiion, otherwise auto-set it to not in position
            handleSquadMarkerClick(event, false, event.shiftKey);
        }
    }
}

/** Handles event for squad markers like drag or clicks 
 * @argument ignoreLeftClick: if set to false, the left click event will handles. Left click gets called specificly from UIFunctions when an squad marker stops being dragged, if the drag distance was 0
 * 
*/
function handleSquadMarkerEvent(event: MouseEvent) {
    console.log(event);
    switch (event.button) {
        // Left clicks get handled by makeSquadMarkerDraggable
        case 2: // Right click/ context menu
            contextMenuOpen = true;
            UIRendering.openSquadContextWindow(event);
            setContextMenuSelected(event);
            break;
        default: break;
    }
}


/**
 * Left click on squad marker to indicate squad is moving to that position
 * @param event Event that got triggered, used to get click target
 * @param toggle Toggle the inPosition value? Value gets set if this is false
 * @param value Sets inPosiion to value if toggle=false
 */
function handleSquadMarkerClick(event: MouseEvent, toggle = true, value = true) {
    // Get pID and sID of element we clicked on
    let [platoonID, squadID] = data.getPlatoonAndSquadOfMarkerElement(event.target as platoonHTMLElement);
    // Get the squad data
    let squad: squad = data.getSquad(platoonID, squadID);
    // Set and save data
    if (toggle) {
        squad.isInPosition = !squad.isInPosition;
    } else {
        squad.isInPosition = value;
    }
    data.setSquad(platoonID, squadID, squad);
    // Update the animation toggle for this squad only
    mapRendering.updateSquadMarkerAnimation(platoonID, squadID);
}


/** Gets an event for a click on a squad marker, saves the squad that was clicked on for later use */
function setContextMenuSelected(e: MouseEvent) {
    contextMenuSelected = data.getPlatoonAndSquadOfMarkerElement(e.target as platoonHTMLElement);
}

/** closes the context menu */
function closeContextMenu() {
    // Context menu not clicked on a menu anymore
    contextMenuSelected = [-1, -1];
    // Also not opened anymore
    contextMenuOpen = false;
    // Stop showing up as opened, please
    UIRendering.closeContextWindow();
}

/** Deletes the squad the current context menu was opened on
 * TODO: Maybe move this to UIFunctions?
 */
function deleteSquadWithDropdown() {
    let pID = contextMenuSelected[0];
    let sID = contextMenuSelected[1];
    // Only delete a squad if we have clicked on a valid squad
    if (pID >= 0 && sID >= 0) {
        let squadToDelete = data.getSquad(pID, sID);
        squadToDelete.isEmpty = true;
        data.setSquad(pID, sID, squadToDelete);
        mapRendering.updateSquadMarker(pID, sID, true);
    }
}

/** Sends the squad with the context menu to the warpgate */
function sendSquadToWarpgate() {
    // Get some clear position near the warpgate
    let pos = data.getFreePositionNearWarpgate();
    let pID = contextMenuSelected[0];
    let sID = contextMenuSelected[1];
    let squadToMove = data.getSquad(pID, sID);
    // Move the squad there
    squadToMove.pos = pos;
    // Apply changes
    data.setSquad(pID, sID, squadToMove);
    // We have move a squad, we need to re-render it
    mapRendering.updateSquadMarker(pID, sID);
}



/** The Menu buttons get created only once at start, so no need to add the listeners more than once either */
function setDropdownMenuButtons() {
    document.getElementById("sendToWarpgateButton").addEventListener('click', () => {
        sendSquadToWarpgate();
        closeContextMenu();
    });

    document.getElementById("deleteSquadButton").addEventListener('click', () => {
        deleteSquadWithDropdown();
        closeContextMenu();
    });
}

setDropdownMenuButtons();

export { handleRendererMouseEvent, makeSquadMarkerDragAble, handleSquadMarkerEvent, mousePos, dragMovement, dragStartPosition }