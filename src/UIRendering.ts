import { squad, platoonHTMLElement, platoon, resolutionSettings } from "./classes"
import { mousePos, dragMovement, dragStartPosition } from "./mouseEventHandler";
import data from "./data";
import camera from "./camera";

import { addPlatoon, removePlatoon, setSquadMarkerDeletedState, setSquadMarkerMovingState, FOCUS, restartRendering } from "./UIFunctions";

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
            drag: ""
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
            isFocused: false
        }
    },
    methods: {
        getText(): string {
            return FOCUS.value ? "Focused" : "Unfocsued";
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

            settingsDone: true,
            // Data for continents, TODO: be loaded from data instead
            continents: data.vueContinentObject,

            resolutions: data.vueResolutionObject,

            continentSelectedID: -1,
            warpgateSelectedID: -1,
            selectedParentResolution: "",
            selectedResolutionID: -1,
            autoResolutionTarget: "",



            factionSelect: '',
            // Methods:
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
                removePlatoon(id);
            },

            saveSettings: function () {
                startRendering()
            },

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
                let light = platoonData.lightColor;
                let normal = platoonData.color;
                let darker = platoonData.darkerColor;
                if (!platoonData.squads[squadIndex].isInPosition && !isEmpty) {
                    return {
                        color: darker,
                        background: `repeating-linear-gradient(45deg, ${light}, ${light} 5px, transparent 5px, transparent 10px)`,
                        borderColor: isEmpty ? normal : darker
                    }
                } else {
                    return {
                        color: darker,
                        backgroundColor: isEmpty ? 'transparent' : light,
                        borderColor: isEmpty ? normal : darker
                    }
                }

            },
        }
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