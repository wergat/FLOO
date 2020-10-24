import * as Color from 'color';
import { squad, platoonHTMLElement, platoon, resolutionSettings } from "./classes"
import { mousePos, dragMovement, dragStartPosition } from "./mouseEventHandler";
import data from "./data";
import camera from "./camera";
import { updatePlatoonColor, updateMapMarkerPositions, reRenderMapBody } from './mapRendering';
import { addPlatoon, removePlatoon, setSquadMarkerDeletedState, setSquadMarkerMovingState, FOCUS, restartRendering, setPlatoonColor } from "./UIFunctions";

const Vue = require("../AAA/vue.js");
import Buefy from "buefy";


Vue.use(Buefy, {
    defaultIconPack: 'fas',
    defaultContainerElement: '#content'
});


/** (Half the) Size of the Squad marker in pixels */
let squadMarkerSize = 17;

/** HTML Element for mouse Debug information */


const MousePositionApp = new Vue({
    data() {
        return {
            isActive: true,
            mouseScreenPos: "",
            mouseMapPos: "",
            cameraPos: "",
            zoomFactor: "",
            drag: "",
            render: false
        }
    }
})
MousePositionApp.$mount('#MousePosBox')


function initMousePosBox() {
    let mpbStyle = document.getElementById("MousePosBox").style
    mpbStyle.bottom = "0px";
    mpbStyle.position = "absolute";
}
initMousePosBox();

function initRightToolBox() {
    let style = document.getElementById("right-tool-box").style
    style.position = "absolute";
    style.top = "200px";
    style.right = "0px";
}
initRightToolBox();

/** Actually updates the html of the mouse debug box */
function updateMouseDebugBoxHTML() {
    let cameraPos = camera.getCurrentPosition();
    MousePositionApp.mouseScreenPos = "Mouse Screen @ [" + mousePos.x + "|" + mousePos.y + "]";
    MousePositionApp.mouseMapPos = "Mouse Map @ [" + (cameraPos.x + camera.zoomFactor * mousePos.x).toFixed(2) + "|" + (cameraPos.y + camera.zoomFactor * mousePos.y).toFixed(2) + "]";
    MousePositionApp.cameraPos = "MapEdge @ [" + (cameraPos.x).toFixed(2) + "|" + (cameraPos.y).toFixed(2) + "]";
    MousePositionApp.zoomFactor = "Zoom Level " + camera.zoomFactor + " [" + camera.currentZoomLevel + "] @ [" + (camera.mapRenderSize.x).toFixed(0) + "x" + (camera.mapRenderSize.y).toFixed(0) + "]";
    MousePositionApp.drag = "Drag @ [" + (dragStartPosition.x).toFixed(2) + "|" + (dragStartPosition.y).toFixed(2) + "] -> [" + (dragMovement.x).toFixed(2) + "|" + (dragMovement.y).toFixed(2) + "]";
}

/** Closes the Context Window again with animation, then removes it from the screen after .05s */
function closeContextWindow() {
    let menuEle = document.getElementById("contextMenu");
    menuEle.style.height = "0px";
    setTimeout(function () { menuEle.style.left = "-1000px"; menuEle.style.top = "-1000px"; }, 50);
}


/** Opens the Context Menu for an element */
function openSquadContextWindow(e: MouseEvent) {
    const relativePos = { x: 30, y: 0 };
    let menuEle = document.getElementById("contextMenu");
    let [i, j] = data.getPlatoonAndSquadOfMarkerElement(e.target as platoonHTMLElement);

    menuEle.style.left = (camera.invZoomFactor * (data.getSquad(i, j).pos.x - camera.onMapPos.x) - squadMarkerSize + relativePos.x) + "px";
    menuEle.style.top = (camera.invZoomFactor * (data.getSquad(i, j).pos.y - camera.onMapPos.y) - squadMarkerSize + relativePos.y) + "px";
    menuEle.style.height = "200px";
}

let app = new Vue({
    el: "#debugDisplay",
    data() {
        return {
            isFocused: false,
            render: false
        }
    },
    methods: {
        getText(): string {
            return FOCUS.value ? "Focused" : "Unfocsued";
        }
    }
});


let rightToolBoxApp = new Vue({
    el: '#right-tool-box',
    data() {
        return {
            render : false
        }
    },
    methods: {
        getPathToPic(faction: string, type: string) {
            return `./img/${faction}${type}.png`;
        },
        addToMap(faction: number, type: number) {
            let cameraPos = camera.getCurrentPosition();
            let centerCamPos = { x: cameraPos.x + (camera.mapRenderSize.x / 2), y: cameraPos.y + (camera.mapRenderSize.y / 2) };
            data.addMapMarker(centerCamPos, faction, type);
            reRenderMapBody();
        }

    }
});



let leftBoxContentApp = new Vue({
    el: "#leftBoxContentApp",
    data() {
        return {
            // Tab active (Either Settings or Platoon)
            activeContentTab: 0,
            // Platoon ID of Card opened
            platoonCardOpen: -1,
            // Platoon Data
            platoons: data.vuePlatoonsObject,

            colorPickOpenIndex: -1,
            colorPickIsOpen: false,
            colorHue: 0,
            colorSat: 0,
            colorLig: 0,
            settingsDone: true,
            // Data for continents, TODO: be loaded from data instead
            continents: data.vueContinentObject,

            resolutions: data.vueResolutionObject,

            continentSelectedID: -1,
            warpgateSelectedID: -1,
            selectedParentResolution: "",
            selectedResolutionID: -1,
            autoResolutionTarget: "",

            value: 0,

            factionSelect: '',

            autoDetectResolution: function (arr: resolutionSettings[]) {
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i].detected == this.autoResolutionTarget) {
                        this.selectedParentResolution = arr[i].parent;
                        this.selectedResolutionID = arr[i].id;
                    }
                }
            },

            getStyleElement: function (platoonData: platoon, squadIndex: number) {
                let isEmpty = platoonData.squads[squadIndex].isEmpty;

                let lightest = platoonData.lightestColor;
                let light = platoonData.lightColor;
                let normal = platoonData.color;
                let isDark = this.isDark(normal);
                let darkest = platoonData.darkestColor;

                // If is striped == existing and moving == not empty and not in posiion 
                if (!platoonData.squads[squadIndex].isInPosition && !isEmpty) {
                    return {
                        color: 'black',
                        background: `repeating-linear-gradient(45deg, ${light}, ${light} 5px, transparent 5px, transparent 10px)`,
                        borderColor: darkest
                    }
                } else {
                    return {
                        color: (isDark && !isEmpty) ? 'white' : 'black',
                        backgroundColor: isEmpty ? 'transparent' : light,
                        borderColor: isEmpty ? normal : darkest
                    }
                }

            },
        }
    },
    methods: {
        isDark: function (color: string) {
            return Color(color).isDark();
        },

        /** Loads color into the platoon color picker from platoon data */
        loadColorPicker: function (platoonData: platoon) {
            let color = Color(platoonData.color);
            this.colorHue = Math.round(color.hue());
            this.colorSat = Math.round(color.saturationl());
            this.colorLig = Math.round(color.lightness());
        },
        /** Updates color for platoon based on hue/sat/lig set
         * also clamps colorHue to [0,360]
         */
        updatePlatoonColor: function (platoonData: platoon, platoonID: number) {
            this.colorHue = (this.colorHue + 360) % 360;
            let color = Color(`hsl(${this.colorHue},${this.colorSat}%,${this.colorLig}%)`);
            setPlatoonColor(platoonData, color);
            updatePlatoonColor(platoonID);
        },

        toggleSquadDelete: function (platoonID: number, squadID: number, event: Event) {
            if (platoonID >= 0 && squadID >= 0) {
                setSquadMarkerDeletedState(platoonID, squadID, true);
            }
        },

        toggleSquadArrival: function (platoonID: number, squadID: number, event: Event) {
            if (platoonID >= 0 && squadID >= 0) {
                setSquadMarkerMovingState(platoonID, squadID, true);
            }
        },

        openSquad: function (platoonID: number) {
            this.platoonCardOpen = platoonID;
        },

        platoonNameChangeDone: function () {
            data.savePlatoonData();
        },

        addPlatoon: function () {
            addPlatoon();
        },

        removePlatoon: function (id: number) {
            this.platoonCardOpen = -1;
            removePlatoon(id);
        },

        saveSettings: function () {
            startRendering();
        },
    },
    computed: {

        getSettingsProgress: function (): number {
            let perc = 0;
            if (this.isWarpgateAndContinentOkay) {
                perc += 34;
            }
            if (this.isResolutionOkay) {
                perc += 34;
            }
            if (this.factionSelect != '') {
                perc += 32;
            }
            return perc;
        },

        isWarpgateAndContinentOkay: function (): boolean {
            return this.continentSelectedID >= 0 && this.warpgateSelectedID >= 0;
        },

        isResolutionOkay: function (): boolean {
            if (this.selectedResolutionID < 0) {
                return false;
            }
            if (this.resolutions.value[this.selectedResolutionID].parent === this.selectedParentResolution) {
                return true;
            }
            return false;
        },

        getSupportedParentResolutions: function (): any {
            let list = [];
            for (let i = 0; i < this.resolutions.value.length; i++) {
                if (list.indexOf(this.resolutions.value[i].parent) === -1) {
                    list.push({ name: this.resolutions.value[i].parent, id: this.resolutions.value[i].id });
                }
            }
            return list;
        },

        getSupportedResolutions: function (): any {
            let list = [];
            for (let i = 0; i < this.resolutions.value.length; i++) {
                if (this.resolutions.value[i].parent === this.selectedParentResolution) {
                    list.push({ name: this.resolutions.value[i].resolution, id: this.resolutions.value[i].id });
                }
            }
            return list;
        },

        getWarpgates: function () {
            if (this.continentSelectedID >= 0) {
                return this.continents.value[this.continentSelectedID].warpgates;
            } else {
                return [{ id: 0, name: "no warpgate data found" }];
            }
        }
    }
})

/** Loads the current settings into the vue instance
 * used to load initial data on startup
 */
function loadSettingsData() {
    leftBoxContentApp.selectedResolutionID = data.resolutionSelectedID;
    leftBoxContentApp.continentSelectedID = data.continentSelectedID;
    leftBoxContentApp.warpgateSelectedID = data.warpgateSelectedID;
    if (data.vueResolutionObject.value[data.resolutionSelectedID] !== undefined) {
        if (data.vueResolutionObject.value[data.resolutionSelectedID].parent !== undefined) {
            leftBoxContentApp.selectedParentResolution = data.vueResolutionObject.value[data.resolutionSelectedID].parent;
        }
    }
}

/** Enables rendering and stuff after settings are set */
function startRendering() {
    // Save data
    data.resolutionSelectedID = leftBoxContentApp.selectedResolutionID;
    data.continentSelectedID = leftBoxContentApp.continentSelectedID;
    data.warpgateSelectedID = leftBoxContentApp.warpgateSelectedID;

    restartRendering();

    rightToolBoxApp.render = true;

    // Mark settings as being completed, yay. Platoons can now be accessed/edited
    leftBoxContentApp.settingsDone = true;
}

/** Sets the resolution used to auto-detect the current screen size */
function setAutoDetectResolution(s: string) {
    leftBoxContentApp.autoResolutionTarget = s;
}

function forceSettingsCheck() {
    leftBoxContentApp.settingsDone = false;
    leftBoxContentApp.activeContentTab = 1;
}

export { updateMouseDebugBoxHTML, closeContextWindow, openSquadContextWindow, forceSettingsCheck, setAutoDetectResolution, loadSettingsData, leftBoxContentApp }