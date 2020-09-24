import * as color from 'color';
interface coord { x: number; y: number; };

interface rect {
    topLeft: { x: number, y: number },
    bottomRight: { x: number, y: number }
}

interface PlatoonHTMLElement extends HTMLElement {
    platoon: number; squad: number;
}

class Platoon {
    squads: Squad[];
    color: color;
    borderColor: color;

    SetColor(tColor: color) {
        this.color = tColor;
        this.borderColor = tColor.darken(0.5);
    }
    constructor(color: color) {
        this.SetColor(color);
        // Alpha, Bravo, Charly, Delta
        this.squads = [];
    }
}

class Squad {
    platoonNumber: Number;
    squadLetter: String;
    isRendered: boolean;
    isInPosition: boolean;
    name: String;
    pos: coord;
    isEmpty: boolean;

    static validLetters = ["a", "b", "c", "d"];
    constructor(platoonNumber: number, squadLetter: string, _pos: coord) {
        if (!Squad.validLetters.includes(squadLetter)) { console.error("Unknown squad letter", squadLetter); }
        if (platoonNumber < 0) { console.error("Platoon number must be larger than 0", platoonNumber); }

        this.platoonNumber = platoonNumber;
        this.squadLetter = squadLetter;
        this.isRendered = true;
        this.isInPosition = true;

        this.isEmpty = false;
        this.pos = _pos;
        this.name = "[NoName]";
    }
}

interface warpgate {
    name: string;
    x: number;
    y: number;
}

interface continent {
    name: string;
    mapBoxSize: coord;
    UIColor: { primary: string, secondary: string };
    warpgates: warpgate[];
}

interface resolutionSettings {
    resolution: string;
    mapBoundingBox: rect;
}

/** IDK if there is a way to properly import this, so instead i just hardcoded it 
 * imports and returns continent data
*/
function importContinentData(data: any): continent[] {
    let continentArray: continent[] = [];
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
function importResolutionSettings(data: any): resolutionSettings[] {
    let resolutionData: resolutionSettings[] = [];
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


export { coord, rect, Platoon, Squad, warpgate, continent, resolutionSettings, PlatoonHTMLElement, importContinentData, importResolutionSettings }





