import * as UIRendering from "./UIRendering"

/** Update the mouse box only every x ms  */
let DEBUGDidUpdateMouseBox = false;

function updateZoomLevel() {
    // TODO: Update Zoom Displayed on UI
}


/** Gets called every few ms to check if the deubg box needs an update */
function updateDebugIfNeeded() {
    if (DEBUGDidUpdateMouseBox) {
        UIRendering.updateMouseDebugBoxHTML()
        DEBUGDidUpdateMouseBox = false;
    }
}

/** Flags the mouse box as being outdated, because one of the vars displayed was changed.
 * Box gets updated with new info next update tick.
 */
function flagMouseBoxUpdate(){
    DEBUGDidUpdateMouseBox = true;
}



export { updateZoomLevel, flagMouseBoxUpdate, updateDebugIfNeeded };