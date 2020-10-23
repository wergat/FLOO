import { coord, rect, platoon, squad, warpgate, continent, resolutionSettings, platoonHTMLElement } from "./classes";
import * as Color from 'color';
const Store = require('electron-store');
const Vue = require("../AAA/vue.js");

/** Used to store the settings, like resolution, screen, warpgate, continent */
const settingsStore = new Store({ name: 'config' });
/** Used to store data about each platoon in case of restart etc. */
const platoonStore = new Store({ name: 'platoons' });

/** IDK if there is a way to properly import this, so instead i just hardcoded it 
     * imports and returns continent data
    */
function importContinentData(data: any): continent[] {
    let continentArray: continent[] = [];
    for (let i = 0; i < data.length; i++) {
        continentArray[i] = {
            name: data[i].name as string,
            id: data[i].id as number,
            mapBoxSize: { x: data[i].mapBoxSize.x as number, y: data[i].mapBoxSize.y as number },
            UIColor: { primary: data[i].UIColor.primary as string, secondary: data[i].UIColor.secondary as string },
            warpgates: [
                { id: data[i].warpgates[0].id as number, name: data[i].warpgates[0].name as string, x: data[i].warpgates[0].x as number, y: data[i].warpgates[0].y as number },
                { id: data[i].warpgates[1].id as number, name: data[i].warpgates[1].name as string, x: data[i].warpgates[1].x as number, y: data[i].warpgates[1].y as number },
                { id: data[i].warpgates[2].id as number, name: data[i].warpgates[2].name as string, x: data[i].warpgates[2].x as number, y: data[i].warpgates[2].y as number }
            ]
        };
    }
    return continentArray;
}



/** IDK if there is a way to properly import this, so instead i just hardcoded it
 * imports and returns continent data
 */
function importResolutionSettings(data: any): resolutionSettings[] {
    let resolutionData: resolutionSettings[] = [];
    for (let i = 0; i < data.length; i++) {
        resolutionData[i] = {
            id: data[i].id as number,
            resolution: data[i].resolution as string,
            parent: data[i].parent as string,
            detected: data[i].detected as string,
            resolutionScale: data[i].resolutionScale as number,
            mapBoundingBox: {
                topLeft: { x: data[i].mapBoundingBox.topLeft.x, y: data[i].mapBoundingBox.topLeft.y },
                bottomRight: { x: data[i].mapBoundingBox.bottomRight.x, y: data[i].mapBoundingBox.bottomRight.y }
            },
        }
    }
    return resolutionData;
}




class Data {
    /** Data about the continents */
    vueContinentObject = { value: new Array<continent>() };
    /** Data for varios UI scaling etc when choosing different resolutions */
    vueResolutionObject = { value: new Array<resolutionSettings>() };
    /** All the data about the platoons and squads */
    vuePlatoonsObject = { value: new Array<platoon>() };

    private _resolutionSelectedID = -1;
    /** ID of currently selected resolution 
     *  Setting this saves the new value to disk*/
    get resolutionSelectedID(): number {
        return this._resolutionSelectedID;
    }

    set resolutionSelectedID(value: number) {
        this._resolutionSelectedID = value;
        if (value != undefined || value < 0) {
            settingsStore.set('resolution', value);
        } else { console.warn("Resolution ID set to undefined"); }

    }

    private _continentSelectedID = -1;
    /** ID of continent selected
     * Setting this saves the new value to disk
     */
    get continentSelectedID(): number {
        return this._continentSelectedID;
    }

    set continentSelectedID(value: number) {
        this._continentSelectedID = value;
        if (value != undefined || value < 0) {
            settingsStore.set('continent', value);
        } else { console.warn("Continent ID set to undefined"); }
    }


    private _warpgateSelectedID = -1;
    /** ID of warpgate selected
     * Setting this saves the new value to disk
     */
    get warpgateSelectedID(): number {
        return this._warpgateSelectedID;
    }

    set warpgateSelectedID(value: number) {
        this._warpgateSelectedID = value;
        if (value != undefined || value < 0) {
            settingsStore.set('warpgate', value);
        } else { console.warn("Warpgate ID set to undefined"); }
    }

    store: any;
    /** Colors for each platoon. */
    platColors = [Color("#416ACC"), Color("#47CCB5"), Color("#4FCC3D"), Color("#CCBF33"), Color("#CC8B2F")];

    loadPlatoonData() {
        // Empty current data
        this.vuePlatoonsObject.value.splice(0, this.vuePlatoonsObject.value.length);
        let i = 0;
        let platData;
        while (platData = platoonStore.store[i]) {
            this.vuePlatoonsObject.value.push(platData as platoon);
            i++;
        }
    }

    loadSavedSettings(): boolean {
        let needSetup = false;
        // Other Settings
        this.resolutionSelectedID = settingsStore.get('resolution');
        if (this.resolutionSelectedID == undefined || this.resolutionSelectedID < 0) {
            this.resolutionSelectedID = -1;
            needSetup = true;
        }
        this.continentSelectedID = settingsStore.get('continent');
        if (this.continentSelectedID == undefined || this.continentSelectedID < 0) {
            this.continentSelectedID = -1;
            needSetup = true;
        }
        this.warpgateSelectedID = settingsStore.get('warpgate');
        if (this.warpgateSelectedID == undefined || this.warpgateSelectedID < 0) {
            this.warpgateSelectedID = -1;
            needSetup = true;
        }
        //return needSetup;
        return true;
    }

    reloadAllData() {
        // Loading the general data files with continent and resolution info
        this.vueContinentObject.value = importContinentData(require("../ContinentData.json"));
        this.vueResolutionObject.value = importResolutionSettings(require("../resolutionSettings.json"));

        this.store = platoonStore.store;
        // Load platoon data from file
        this.loadPlatoonData();


    }

    /** Returns squad s in platoon p from saved platoon list
     * @returns Squad s in platoon p
     * @param {number} p platoon ID 
     * @param {number} s ID of squad in platoon p
    */
    getSquad(p: number, s: number): squad {
        if (s < 0 || s > 4) { throw new Error("Squad Index out of bounds."); }
        return this.getPlatoon(p).squads[s];
    }

    /** Returns platoon with id i */
    getPlatoon(i: number): platoon {
        if (i < 0 || i >= this.vuePlatoonsObject.value.length) { throw new Error("Platoon Index out of bounds."); }
        return this.vuePlatoonsObject.value[i];
    }

    /** @returns amount of platoons in list right now */
    getPlatoonCount(): number {
        return this.vuePlatoonsObject.value.length;
    }

    /** Returns the currently selected continent as object */
    getCurrentContinent(): continent {
        return this.vueContinentObject.value[this.continentSelectedID];
    }

    /** Returns the currently selected warpgate as object*/
    getCurrentWarpgate(): warpgate {
        return this.getCurrentContinent().warpgates[this.warpgateSelectedID];
    }

    /** Returns a random position near the warpgate that is not near any other squad marker right now */
    getFreePositionNearWarpgate(): coord {
        let WGData = this.getCurrentWarpgate();
        let WGPos: coord = { x: WGData.x, y: WGData.y };
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
            for (var i = 0; i < this.getPlatoonCount(); i++) {
                for (var j = 0; j < 4; j++) {
                    squad = this.getSquad(i, j);
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

    savePlatoonData() {
        platoonStore.store = this.vuePlatoonsObject.value;
    }

    /** Removes platoon with platoonID */
    removePlatoon(platoonID: number) {
        this.vuePlatoonsObject.value.splice(platoonID, 1);
        this.savePlatoonData();
    }

    /** Saves platoon data of a platoon with platoon id. Also writes data to disk */
    setPlatoon(platoonID: number, platoon: platoon) {
        this.vuePlatoonsObject.value[platoonID] = platoon;
        this.savePlatoonData();
    }

    /** Saves squad data of a squad with platoon id and squad id. Also writes data to disk */
    setSquad(platoonID: number, squadID: number, squad: squad) {
        this.vuePlatoonsObject.value[platoonID].squads[squadID] = squad;
        this.savePlatoonData();
    }

    /**  
     * 
     * @argument ele Squad Marker element or child of squad marker element as PlatoonHTMLElement
     * @returns touple of [platoonID, squadID] as [number,number]
     */
    getPlatoonAndSquadOfMarkerElement(ele: platoonHTMLElement): [number, number] {
        // In case a child element got put in
        while (!ele.classList.contains("squadMarker")) {
            // IDK how this would happen, but saftey first
            if (ele.parentElement == null) {
                throw new Error("Element not squad marker or child of squad marker");
            }
            ele = ele.parentElement as platoonHTMLElement;
        }
        return [ele.platoon, ele.squad];
    }

}

export default new Data();





