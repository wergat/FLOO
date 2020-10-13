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
    color: color;
    darkerColor: color;
    brigtherColor: color;

    SetColor(tColor: color) {
        this.color = tColor;
        this.darkerColor = tColor.darken(0.5);
        this.brigtherColor = tColor.lighten(0.5);
    }
    constructor(color: color) {
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


export { coord, rect, platoon, squad, warpgate, continent, resolutionSettings, platoonHTMLElement }