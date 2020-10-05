import { Squad, PlatoonHTMLElement } from "./classes"
import { mousePos, dragMovement, dragStartPosition } from "./mouseEventHandler";
import data from "./data";
import camera from "./camera";
import { selectPosition } from "./UIFunctions";



/** (Half the) Size of the Squad marker in pixels */
let squadMarkerSize = 17;


/** Platoon Box on the left that is currently opened -1 := none opend 
 * TODO: Move this to UIFunctions
*/
let OpenedPlatoonBox = -1;


/** HTML Element for mouse Debug information */
let mousePosBox = document.getElementById("MousePosBox");


/** Actually updates the html of the mouse debug box */
function updateMouseDebugBoxHTML() {
    mousePosBox.innerHTML = "Mouse Screen @ [" + mousePos.x + "|" + mousePos.y + "]<br>" +
        "Mouse Map @ [" + (camera.onMapPos.x + camera.zoomFactor * mousePos.x).toFixed(2) + "|" + (camera.onMapPos.y + camera.zoomFactor * mousePos.y).toFixed(2) + "] <br>" +
        "MapEdge @ [" + (camera.onMapPos.x).toFixed(2) + "|" + (camera.onMapPos.y).toFixed(2) + "] <br>" +
        "Zoom Level " + camera.zoomFactor + " [" + camera.currentZoomLevel + "] @ [" + (camera.mapRenderSize.x).toFixed(0) + "x" + (camera.mapRenderSize.y).toFixed(0) + "] <br>" +
        "Drag @ [" + (dragStartPosition.x).toFixed(2) + "|" + (dragStartPosition.y).toFixed(2) + "] -> [" + (dragMovement.x).toFixed(2) + "|" + (dragMovement.y).toFixed(2) + "]";
}




function reRenderPlatoonBox() {
    let str = "";
    for (let i = 0; i < data.getPlatoonCount(); i++) {
        str += "<div id='platoon" + i + "' class='platoonListEntry'><div class='platoonListID' id='platoonListID" + i + "'>Platoon " + i + " <div><i class='arrow down' id='platoon" + i + "Arrow'></i></div> </div>" +
            "<div class='squadList'>";
        for (let j = 0; j < 4; j++) {
            str += "<div class='squadListEntry' id='squadListEntryP" + i + "S" + j + "'><div class='squadListEntryLetter'><a>" + Squad.validLetters[j] +
                "</a></div> <div class='squadListEntryName' contenteditable='true' id='squadListNameP" + i + "S" + j + "'>" + data.getSquad(i, j).name +
                "</div></div>";
        }


        str += "</div></div>";
    }
    document.getElementById("PlatoonBox").innerHTML = str;

    for (let i = 0; i < data.getPlatoonCount(); i++) {
        document.getElementById("platoon" + i).style.backgroundColor = data.getPlatoon(i).color.toString();
        let a = i;
        document.getElementById("platoonListID" + i).addEventListener('click', function () { extendPlatoonList(a); });
        for (let j = 0; j < 4; j++) {
            let b = j;
            document.getElementById("squadListNameP" + a + "S" + b).addEventListener("input", function () { data.getSquad(a, b).name = document.getElementById("squadListNameP" + a + "S" + b).innerText; }, false);
            document.getElementById("squadListEntryP" + i + "S" + j).style.float = (j % 2 == 0) ? "left" : "right";
        }
    }
}


/** Re-renders the continent select button */
function reRenderContinentSelectButtons() {
    let dropdownElement = document.getElementById("continentSelectDropdown");
    let str = "";

    let contID = 0;
    for (let continent of data.continentData) {
        str += "<div class='dropdownWarpgate'>" +
            "<button class='warpgateSelectButton' id='continentSelectButton" + continent.name + "'>" + continent.name + "</button>" +
            "<div class='dropdownWarpgate-content' id='warpgateSelectDropdown'>";
        let WGID = 0;
        for (let warpgate of continent.warpgates) {
            str += "<a id='selectC" + contID + "WG" + WGID + "'>" + warpgate.name + "</a>";
            WGID++;
        }
        str += "</div></div>";
        contID++;
    }
    dropdownElement.innerHTML = str;

    // Apply dynamic style changes
    contID = 0;
    for (var continent of data.continentData) {
        let ele = document.getElementById("continentSelectButton" + continent.name);
        ele.style.backgroundColor = continent.UIColor.secondary;
        var WGID = 0;
        for (var warpgate of continent.warpgates) {
            let a = contID; let b = WGID; // Temp vars because js doesnt know how to not handle reference type variables
            document.getElementById(`selectC${contID}WG${WGID}`).addEventListener('click', function () { selectPosition(a, b); });
            WGID++;
        }
        contID++;
    }
}

/** Rerenders everything in the left UI Box */
function reRenderLeftBox() {
    reRenderPlatoonBox();
    reRenderContinentSelectButtons();
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




/** Closes the Context Window again with animation, then removes it from the screen after .05s */
function closeContextWindow() {
    let menuEle = document.getElementById("contextMenu")
    menuEle.style.height = "0px";
    setTimeout(function () { menuEle.style.left = "-1000px"; menuEle.style.top = "-1000px"; }, 50);
}


/** Opens the Context Menu for an element */
function openSquadContextWindow(e: MouseEvent) {
    const relativePos = { x: 30, y: 0 };
    let ele = e.target as PlatoonHTMLElement;
    // If we click on a child element (e.g. the letter, search for next best parent)
    while(!ele.classList.contains("squadMarker")){
        // IDK how this would happen, but saftey first
        if(ele.parentElement == null){ return; }
        ele = ele.parentElement as PlatoonHTMLElement;
    }
    let i = ele.platoon; let j = ele.squad;
    let menuEle = document.getElementById("contextMenu");
    menuEle.style.left = (camera.invZoomFactor * (data.getSquad(i, j).pos.x - camera.onMapPos.x) - squadMarkerSize + relativePos.x) + "px";
    menuEle.style.top = (camera.invZoomFactor * (data.getSquad(i, j).pos.y - camera.onMapPos.y) - squadMarkerSize + relativePos.y) + "px";
    menuEle.style.height = "200px";
}

export { updateMouseDebugBoxHTML, closeContextWindow, openSquadContextWindow, extendPlatoonList, reRenderLeftBox, reRenderPlatoonBox, reRenderContinentSelectButtons, OpenedPlatoonBox }