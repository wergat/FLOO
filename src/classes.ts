import * as color from 'color';

interface Coord { x: number; y: number; };

interface Rect {
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
    pos: Coord;
    isEmpty: boolean;

    static validLetters = ["a", "b", "c", "d"];
    constructor(platoonNumber: number, squadLetter: string, _pos: Coord) {
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

interface Warpgate {
    name: string;
    x: number;
    y: number;
}

interface Continent {
    name: string;
    mapBoxSize: Coord;
    UIColor: { primary: string, secondary: string };
    warpgates: Warpgate[];
}

interface ResolutionSettings {
    resolution: string;
    mapBoundingBox: Rect;
}


export { Coord, Rect, Platoon, Squad, Warpgate, Continent, ResolutionSettings, PlatoonHTMLElement }