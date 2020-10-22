import * as color from 'color';

interface coord { x: number; y: number; };

interface rect {
    topLeft: { x: number, y: number },
    bottomRight: { x: number, y: number }
}

interface platoonHTMLElement extends HTMLElement {
    platoon: number; squad: number;
}

/**
 * Enum to set a squad to a specific type
 * like armor squad, air squad
 */
enum squadType {
    none,
    armor,
    air,
    bastion
}


class platoon {
    squads: squad[];
    color: string;
    darkerColor: string;
    lightColor: string;
    name: string;

    SetColor(tColor: color) {
        this.color = tColor.toString();
        this.darkerColor = tColor.darken(0.5).toString();
        this.lightColor = tColor.lighten(0.5).toString();
    }
    constructor(color: color) {
        this.name = "ajshdashjkdsa";
        this.SetColor(color);
        // Alpha, Bravo, Charly, Delta
        this.squads = [];
    }
}

class squad {
    /** Number/ID of platoon this squad is a part of */
    platoonNumber: number;
    /** Letter of squad A-D for alpha - delta */
    squadLetter: string;
    /** Is the squad in the camera area? */
    isRendered: boolean;
    /** Currently in position? If not, it shows that it is not in position. */
    isInPosition: boolean;
    /** State of isInPosition that is currently rendered. Used to only update squad markers when isInPosition changes */
    isInPositionRenderedState: boolean
    /** Name of Outfit that is related to this squad */
    name: string;
    /** Position of this map in MapSpace */
    pos: coord;
    /** Is this squad empty? (~Deleted) */
    isEmpty: boolean;
    /** Marker for the squad */
    marker: squadType;

    static validLetters = ["a", "b", "c", "d"];
    constructor(platoonNumber: number, squadLetter: string, _pos: coord) {
        if (!squad.validLetters.includes(squadLetter)) { console.error("Unknown squad letter", squadLetter); }
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
    id: number;
}

interface continent {
    name: string;
    id: number;
    mapBoxSize: coord;
    UIColor: { primary: string, secondary: string };
    warpgates: warpgate[];
}

interface resolutionSettings {
    id: number;
    resolution: string;
    parent: string;
    detected: string;
    resolutionScale:number;
    mapBoundingBox: rect;
}

interface squadMarkerSizeSettings {
    name : string;
    radius : number;
    arrowDistance : number;
}


export { coord, rect, platoon, squad, warpgate, continent, resolutionSettings, platoonHTMLElement, squadMarkerSizeSettings }