import { Coord } from "./classes"
import camera from "./camera";
import * as UI from "./UI";
import * as UIRendering from "./UIRendering";
import * as mapRendering from "./mapRendering";
import { setMapAsDragged, FOCUS } from "./UIFunctions";

/**TODO:  ??? */
let canDragMap: boolean;

/** Screenspace position of dragging mouse last event */
let lastDragPosition: Coord = { x: 0, y: 0 };
/** So we know where the MAPSPACE camera pos is compared to dragStartPosition */
let relativeCamPositionToDragStart: Coord = { x: 0, y: 0 };

/** Mouse position on map space when map drag starts */
let dragStartPosition: Coord = { x: 0, y: 0 };
/** Total screenspace mouse drag movement, reset on mouseup */
let dragMovement: Coord = { x: 0, y: 0 };

/** Currently Dragging an element? */
let IsDraggingElement = false;
/** TODO: ??? */
let mousePos = { x: 0, y: 0 };


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
                if (FOCUS == false && !IsDraggingElement) {
                    canDragMap = true;
                }

                // Close the context menu if it is open right now
                UIRendering.closeContextWindow();
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
function handleMapDrag(newPos: Coord) {
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

function handleSquadMarkerEvent(event: MouseEvent) {
    switch (event.button) {
        case 0: // Left Click
            if (contextMenuOpen) {
                contextMenuOpen = false;
                UIRendering.closeContextWindow();
            }
            // TODO: Add blinking squad marker
            break;
        case 2: // Right click/ context menu
            contextMenuOpen = true;
            UIRendering.openSquadContextWindow(event);
            break;
        default: break;
    }
}



export { handleRendererMouseEvent, handleSquadMarkerEvent, mousePos, dragMovement, dragStartPosition }