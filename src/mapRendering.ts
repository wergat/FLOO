import { Coord, Rect, Platoon, Squad, Warpgate, Continent, ResolutionSettings, PlatoonHTMLElement } from "./classes";
import data from "./data";
import camera from "./camera";
import { addPlatoon, makeSquadMarkerDragAble, updateMapIfDragged, selectPosition, setWindowsFocus } from "./UIFunctions";
import { handleSquadMarkerEvent } from "./mouseEventHandler";

/** Border size of the Map Bounds Box */
let mapBoundsBoxBorderSize = 5;

/** (Half the) Size of the Squad marker in pixels TODO: THIS VAR EXISTS IN COPY IN UIRendering.ts */
let squadMarkerSize = 17;

/** Rerenders all elements shown on the map itself */
function reRenderMapBody() {
    let str = "<div id='MapBoundsBox'></div>";
    let ele: PlatoonHTMLElement;
    // Build HTML Framework for squad markers
    // TODO: Remove use of innerHTML
    for (var i = 0; i < data.getPlatoonCount(); i++) {
        for (var j = 0; j < 4; j++) {
            if (!data.getSquad(i, j).isEmpty) {
                str += "<div id='MarkerP" + i + "S" + j + "' class='squadMarker clickable'> <div class='squadMarkerLetter squadMarkerLetter" + data.getSquad(i, j).squadLetter + "'>" + data.getSquad(i, j).squadLetter + "</div> </div> <br>";
            }
        }
    }
    document.getElementById("mapBody").innerHTML = str;

    // Add Hooks to make Squad Markers Dragable
    for (var i = 0; i < data.getPlatoonCount(); i++) {
        for (var j = 0; j < 4; j++) {
            if (!data.getSquad(i, j).isEmpty) {
                ele = document.getElementById(`MarkerP${i}S${j}`) as PlatoonHTMLElement;
                // Add Information to keep track of this squad marker more easily within the document
                ele.platoon = i; ele.squad = j;
                makeSquadMarkerDragAble(ele);
                // Add listeners so we can change window focus so they are interactable
                ele.addEventListener('mouseleave', () => { setWindowsFocus(false); });
                ele.addEventListener('mouseenter', () => { setWindowsFocus(true); });
                ele.addEventListener('contextmenu', function (e) { handleSquadMarkerEvent(e); e.preventDefault(); console.log(e); }, false);
                ele.addEventListener('click', function (e) { handleSquadMarkerEvent(e); }, false);

                var SquadStyle = ele.style;
                SquadStyle.backgroundColor = data.getPlatoon(i).color.toString();
                SquadStyle.borderColor = data.getPlatoon(i).borderColor.toString();
            }
        }
    }

    updateSquadMarkerPositions();
}

/** Updates Positions of Squad Markers and the Map Bounding Box */
function updateSquadMarkerPositions() {
    // Add Style
    // Continent Bounding Box
    let ele = document.getElementById("MapBoundsBox");
    let factor = camera.invZoomFactor;
    let x = camera.invZoomFactor;
    let y = camera.invZoomFactor;

    ele.style.width = (x * data.getCurrentContinent().mapBoxSize.x - mapBoundsBoxBorderSize * 2) + "px";
    ele.style.height = (y * data.getCurrentContinent().mapBoxSize.y - mapBoundsBoxBorderSize * 2) + "px";
    let cameraOnMapPos: Coord = camera.getCurrentPositionOnMap();
    ele.style.left = (x * (-cameraOnMapPos.x)) + "px";
    ele.style.top = (y * (-cameraOnMapPos.y)) + "px";

    // Platoon/Squad Positions
    x = 0; y = 0;
    let squad: Squad;
    for (var i = 0; i < data.getPlatoonCount(); i++) {
        for (var j = 0; j < 4; j++) {
            squad = data.getSquad(i, j);
            if (!squad.isEmpty) {
                ele = document.getElementById(`MarkerP${i}S${j}`);
                x = (squad.pos.x - cameraOnMapPos.x);
                y = (squad.pos.y - cameraOnMapPos.y);
                if (x >= 0 && x <= camera.mapRenderSize.x && y >= 0 && y <= camera.mapRenderSize.y) {
                    squad.isRendered = true;
                    // Screen position of squad is dependend on zoom
                    ele.style.left = (factor * x - squadMarkerSize) + "px";
                    ele.style.top = (factor * y - squadMarkerSize) + "px";
                } else {
                    if (squad.isRendered) {
                        ele.style.left = "-100px";
                        ele.style.top = "-100px";
                    }
                }
            }
        }
    }
}

export {reRenderMapBody, updateSquadMarkerPositions}