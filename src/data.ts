import { Coord, Rect, Platoon, Squad, Warpgate, Continent, ResolutionSettings, PlatoonHTMLElement } from "./classes";
import * as color from 'color';
const Store = require('electron-store');


/** Used to store the settings, like resolution, screen, warpgate, continent */
const settingsStore = new Store({ name: 'config' });
/** Used to store data about each platoon in case of restart etc. */
const platoonStore = new Store({ name: 'platoons' });

/** IDK if there is a way to properly import this, so instead i just hardcoded it 
     * imports and returns continent data
    */
function importContinentData(data: any): Continent[] {
    let continentArray: Continent[] = [];
    for (let i = 0; i < data.length; i++) {
        continentArray[i] = {
            name: data[i].name as string,
            mapBoxSize: { x: data[i].mapBoxSize.x as number, y: data[i].mapBoxSize.y as number },
            UIColor: { primary: data[i].UIColor.primary as string, secondary: data[i].UIColor.secondary as string },
            warpgates: [
                { name: data[i].warpgates[0].name as string, x: data[i].warpgates[0].x, y: data[i].warpgates[0].y },
                { name: data[i].warpgates[1].name as string, x: data[i].warpgates[1].x, y: data[i].warpgates[1].y },
                { name: data[i].warpgates[2].name as string, x: data[i].warpgates[2].x, y: data[i].warpgates[2].y }
            ]
        };
    }
    return continentArray;
}

/** IDK if there is a way to properly import this, so instead i just hardcoded it
 * imports and returns continent data
 */
function importResolutionSettings(data: any): ResolutionSettings[] {
    let resolutionData: ResolutionSettings[] = [];
    for (let i = 0; i < data.length; i++) {
        resolutionData[i] = {
            resolution: data[i].resolution as string,
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
    continentData: Continent[] = importContinentData(require("../ContinentData.json"));
    /** Data for varios UI scaling etc when choosing different resolutions */
    resolutionData: ResolutionSettings[] = importResolutionSettings(require("../resolutionSettings.json"));

    /** All the data about the platoons and squads */
    platoons: Platoon[] = [];
    /** 0 = "2560x1377" */
    resolutionSelected: number = 0;
    /** ID of continent selected */
    continentSelectedID = 0;
    /** ID of warpgate selected */
    warpgateSelectedID = 0;

    /** Colors for each platoon. */
    platColors = [color("#416ACC"), color("#47CCB5"), color("#4FCC3D"), color("#CCBF33"), color("#CC8B2F")];


    reloadAllData() {
        // Loading the general data files with continent and resolution info
        this.continentData = importContinentData(require("../ContinentData.json"));
        this.resolutionData = importResolutionSettings(require("../resolutionSettings.json"));

        // Platoon data
        this.platoons = platoonStore.store;

        // Other Settings
        this.resolutionSelected = settingsStore.get('resolution');
        this.continentSelectedID = settingsStore.get('continent');
        this.warpgateSelectedID = settingsStore.get('warpgate');
    }

    /** Returns squad s in platoon p from saved platoon list
     * @returns Squad s in platoon p
     * @param {number} p platoon ID 
     * @param {number} s ID of squad in platoon p
    */
    getSquad(p: number, s: number): Squad {
        if (s < 0 || s > 4) { throw new Error("Squad Index out of bounds."); }
        return this.getPlatoon(p).squads[s];
    }

    /** Returns platoon with id i */
    getPlatoon(i: number): Platoon {
        if (i < 0 || i >= this.platoons.length) { throw new Error("Platoon Index out of bounds."); }
        return this.platoons[i];
    }

    /** @returns amount of platoons in list right now */
    getPlatoonCount(): number {
        return this.platoons.length;
    }

    /** Returns the currently selected continent as object */
    getCurrentContinent(): Continent {
        return this.continentData[this.continentSelectedID];
    }

    /** Returns the currently selected warpgate as object*/
    getCurrentWarpgate(): Warpgate {
        return this.getCurrentContinent().warpgates[this.warpgateSelectedID];
    }

    /** Returns a random position near the warpgate that is not near any other squad marker right now */
    getFreePositionNearWarpgate() : Coord {
        let WGData = this.getCurrentWarpgate();
        let WGPos : Coord = { x: WGData.x, y: WGData.y } ;
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

    /** Saves platoon data of a platoon with platoon id. Also writes data to disk */
    setPlatoon(platoonID: number, platoon: Platoon) {
        this.platoons[platoonID] = platoon;
        platoonStore.store = this.platoons;
    }

    /** Saves squad data of a squad with platoon id and squad id. Also writes data to disk */
    setSquad(platoonID: number, squadID: number, squad: Squad) {
        this.platoons[platoonID].squads[squadID] = squad;
        platoonStore.store = this.platoons;
    }

    /**  
     * 
     * @argument ele Squad Marker element or child of squad marker element as PlatoonHTMLElement
     * @returns touple of [platoonID, squadID] as [number,number]
     */
    getPlatoonAndSquadOfMarkerElement(ele: PlatoonHTMLElement): [number, number] {
        // In case a child element got put in
        while (!ele.classList.contains("squadMarker")) {
            // IDK how this would happen, but saftey first
            if (ele.parentElement == null) {
                throw new Error("Element not squad marker or child of squad marker");
            }
            ele = ele.parentElement as PlatoonHTMLElement;
        }
        return [ele.platoon, ele.squad];
    }

}

export default new Data();





