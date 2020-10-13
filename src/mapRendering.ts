import { coord, rect, platoon, squad, warpgate, continent, resolutionSettings, platoonHTMLElement } from "./classes";
import data from "./data";
import camera from "./camera";
import { addPlatoon, updateMapIfDragged, selectPosition, setWindowsFocus } from "./UIFunctions";
import { handleSquadMarkerEvent, makeSquadMarkerDragAble } from "./mouseEventHandler";
import { enableClickPropagation } from "iohook";
import color = require("color");

interface HTMLArrowElement extends HTMLElement {
    rotation: number;
}

const ARROW_COUNT = 6;

/** Border size of the Map Bounds Box */
let mapBoundsBoxBorderSize = 5;

/** (Half the) Size of the Squad marker in pixels TODO: THIS VAR EXISTS IN COPY IN UIRendering.ts */
let squadMarkerSize = 17;

function SetPositionOnCircle(ele: HTMLArrowElement, size = 20) {
    let deg = (ele.rotation - 135) % 360;
    let rad = deg * (Math.PI / 180);
    let rel = { x: 10, y: 10 };
    ele.style.top = (Math.sin(rad) * size + rel.x) + "px";
    ele.style.left = (Math.cos(rad) * size + rel.y) + "px";
}

// TODO: remove this, used for debug only
function updateCirclePosition(i: number, j: number, size = 20) {
    for (let k = 0; k < ARROW_COUNT; k++) { // 6 Arrows
        let arrowEle = document.getElementById(`squadMarkerAnimationArrowP${i}S${j}A${k}`);
        SetPositionOnCircle(arrowEle as HTMLArrowElement, size);
    }
}

/** Rerenders all elements shown on the map itself */
function reRenderMapBody() {
    let mapBodyElement = document.getElementById("mapBody");

    if (document.getElementById("MapBoundsBox") == null) {
        let mapBoundsBox = document.createElement("div");
        mapBoundsBox.id = "MapBoundsBox";
        mapBodyElement.appendChild(mapBoundsBox);
    }


    let squadEle: HTMLDivElement;
    let letterDiv: HTMLDivElement;
    let squadMarkerAnimationDiv: HTMLDivElement;
    let arrowEle: HTMLArrowElement;



    // Build HTML Framework for squad markers
    // TODO: Remove use of innerHTML
    for (let i = 0; i < data.getPlatoonCount(); i++) {
        for (let j = 0; j < 4; j++) {
            if (!data.getSquad(i, j).isEmpty) {
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
                    squadMarkerAnimationDiv = document.createElement("div");
                    squadMarkerAnimationDiv.classList.add("squadMarkerAnimationDiv");
                    squadMarkerAnimationDiv.id = `squadMarkerAnimationP${i}S${j}`;
                    for (let k = 0; k < ARROW_COUNT; k++) { // 6 Arrows
                        arrowEle = document.createElement("i") as HTMLArrowElement;
                        arrowEle.classList.add("arrow", "squadAnimationArrow");
                        arrowEle.id = `squadMarkerAnimationArrowP${i}S${j}A${k}`;
                        arrowEle.style.transform = `rotate(${k * (360 / ARROW_COUNT)}deg)`;
                        arrowEle.rotation = k * (360 / ARROW_COUNT);
                        SetPositionOnCircle(arrowEle, 25);
                        squadEle.appendChild(arrowEle);
                    }
                    squadEle.appendChild(squadMarkerAnimationDiv);
                    mapBodyElement.append(squadEle);
                }

                /*str += "<div id='' class='squadMarker clickable'>" +
                    "<div class='squadMarkerLetter squadMarkerLetter" + data.getSquad(i, j).squadLetter + "'>" + data.getSquad(i, j).squadLetter + "</div>" +
                    "<div class='squadMarkerAnimationDiv' id='squadMarkerAnimationP" + i + "S" + j + "'>" +
                    "<i class='arrow squad' id='squadMarkerAnimationArrowP" + i + "S" + j + "'></i>" +
                    "<i class='arrow squad' id='squadMarkerAnimationArrowP" + i + "S" + j + "'></i>" +
                    "<i class='arrow squad' id='squadMarkerAnimationArrowP" + i + "S" + j + "'></i>" +
                    "<i class='arrow squad' id='squadMarkerAnimationArrowP" + i + "S" + j + "'></i>" +
                    "</div>" +
                    "</div>";*/
            }
        }
    }


    //document.getElementById("mapBody").innerHTML = str;


    let ele: platoonHTMLElement;
    // Add Hooks to make Squad Markers Dragable
    for (let i = 0; i < data.getPlatoonCount(); i++) {
        for (let j = 0; j < 4; j++) {
            if (!data.getSquad(i, j).isEmpty) {
                ele = document.getElementById(`MarkerP${i}S${j}`) as platoonHTMLElement;
                // Add Information to keep track of this squad marker more easily within the document
                ele.platoon = i; ele.squad = j;
                makeSquadMarkerDragAble(ele);
                // Add listeners so we can change window focus so they are interactable
                ele.addEventListener('mouseleave', () => { setWindowsFocus(false); });
                ele.addEventListener('mouseenter', () => { setWindowsFocus(true); });
                ele.addEventListener('contextmenu', function (e) { handleSquadMarkerEvent(e); e.preventDefault(); console.log(e); }, false);

                let SquadStyle = ele.style;
                SquadStyle.backgroundColor = data.getPlatoon(i).color.string();
                let darker = data.getPlatoon(i).darkerColor.string();
                let normal = data.getPlatoon(i).color.string();
                let brighter = data.getPlatoon(i).brigtherColor.hex();

                if (i % 3 > 0) {
                    let deg = 45 + i * 70;
                    let sizeA = 5 + ((i * 3) % 7);
                    let sizeB = 5 + ((i * 4) % 7);
                    SquadStyle.background = `repeating-linear-gradient(${deg}deg, ${brighter}, ${brighter} ${sizeA}px, ${normal} ${sizeB}px, ${normal} ${sizeA + sizeB}px)`;
                } else {
                    SquadStyle.background = `repeating-radial-gradient(circle, ${brighter}, ${brighter} 10px, ${normal} 10px, ${normal} 20px)`;
                }


                SquadStyle.borderColor = darker
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
    let x = camera.invZoomFactor;
    let y = camera.invZoomFactor;

    ele.style.width = (x * data.getCurrentContinent().mapBoxSize.x - mapBoundsBoxBorderSize * 2) + "px";
    ele.style.height = (y * data.getCurrentContinent().mapBoxSize.y - mapBoundsBoxBorderSize * 2) + "px";
    let cameraOnMapPos: coord = camera.getCurrentPositionOnMap();
    ele.style.left = (x * (-cameraOnMapPos.x)) + "px";
    ele.style.top = (y * (-cameraOnMapPos.y)) + "px";

    // Platoon/Squad Positions
    for (var i = 0; i < data.getPlatoonCount(); i++) {
        for (var j = 0; j < 4; j++) {
            updateSquadMarker(i, j);
        }
    }
}

/** Updates one single squad marker 
 * if force = true updates the squadmarker even if it was empty/"deleted" 
*/
function updateSquadMarker(platoonID: number, squadID: number, force = false) {
    let x = 0; let y = 0;
    let squadData: squad;
    let cameraOnMapPos: coord = camera.getCurrentPositionOnMap();
    let ele: HTMLElement;
    let factor = camera.invZoomFactor;
    let animationEle: HTMLElement;

    // We only read the data here, no reason to save to disk if the squad is rendered or not
    squadData = data.getSquad(platoonID, squadID);

    if (!squadData.isEmpty || force) {
        ele = document.getElementById(`MarkerP${platoonID}S${squadID}`);
        x = (squadData.pos.x - cameraOnMapPos.x);
        y = (squadData.pos.y - cameraOnMapPos.y);
        // If Squad marker is on screen (and not deleted)
        if (x >= 0 && x <= camera.mapRenderSize.x && y >= 0 && y <= camera.mapRenderSize.y && !squadData.isEmpty) {
            squadData.isRendered = true;
            // Screen position of squad is dependend on zoom
            ele.style.left = (factor * x - squadMarkerSize) + "px";
            ele.style.top = (factor * y - squadMarkerSize) + "px";
            // Update squad animation
            updateSquadMarkerAnimation(platoonID, squadID);
        } else {
            if (squadData.isRendered) {
                ele.style.left = "-100px";
                ele.style.top = "-100px";
                squadData.isRendered = false;
            }
        }
    }
}

function updateSquadMarkerAnimation(platoonID: number, squadID: number) {
    let squadData = data.getSquad(platoonID, squadID);
    let ele = document.getElementById(`squadMarkerAnimationP${platoonID}S${squadID}`);
    let arrowEle: HTMLElement;
    if (squadData.isInPosition) { // If squad in position, remove animation right now
        ele.style.display = "none";
        for (let i = 0; i < ARROW_COUNT; i++) {
            arrowEle = document.getElementById(`squadMarkerAnimationArrowP${platoonID}S${squadID}A${i}`);
            arrowEle.style.display = "none";
        }
    } else { // Otherwise add it to the queue to activate it later, but start the animation no as well just to react
        ele.style.display = "block"
        for (let i = 0; i < ARROW_COUNT; i++) {
            arrowEle = document.getElementById(`squadMarkerAnimationArrowP${platoonID}S${squadID}A${i}`);
            arrowEle.style.display = "inline-block";
        }
    }
}

export { reRenderMapBody, updateSquadMarkerPositions, updateSquadMarker, updateCirclePosition, updateSquadMarkerAnimation }