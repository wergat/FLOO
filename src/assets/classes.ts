interface Coord { x: number; y: number }

interface Rect {
    topLeft: { x: number; y: number };
    bottomRight: { x: number; y: number };
}

interface draggableHTMLElement extends HTMLElement {
    isSquad: boolean;
}

interface platoonHTMLElement extends draggableHTMLElement {
    platoon: number; squad: number;
}

interface mapMarkerHTMLElement extends draggableHTMLElement {
    mapMarkerID: number;
}

class MapMarker {
    pos: Coord = { x: 0, y: 0 };

    faction: number = -1;

    type: number = -1;

    isRendered = true;
}

class Squad {
    /** Number/ID of platoon this squad is a part of */
    platoonID: number;

    /** Letter of squad A-D for alpha - delta */
    squadID: number;

    /** Currently in position? If not, it shows that it is not in position. */
    isInPosition: boolean;

    /** Position of this map in MapSpace */
    pos: Coord;

    /** Is this squad empty? (~Deleted) */
    isEmpty: boolean;

    /** Marker for the squad */
    marker: number = -1;

    constructor(platoonID: number, squadID: number, _pos: Coord) {
      this.platoonID = platoonID;
      this.squadID = squadID;
      this.isInPosition = true;

      this.isEmpty = false;
      this.pos = _pos;
    }
}

class Platoon {
    squads: Squad[];

    lightestColor = '';

    lightColor = '';

    color = '';

    darkColor = '';

    darkestColor = '';

    name: string;

    id: number;

    constructor() {
      this.name = 'New Platoon';
      // Alpha, Bravo, Charly, Delta
      this.squads = [];
      this.id = Date.now();
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
    /** DONT USE THIS FOR NOW. TODO:FIND OUT WHY CONTINENT SIZE IS DIFFERENT DEPENDING ON RESOLUTION */
    mapBoxSize: Coord;
    UIColor: { primary: string; secondary: string };
    warpgates: warpgate[];
}

interface ResolutionSettings {
    id: number;
    resolution: Coord;
    parent: Coord;
    detected: Coord;
    resolutionScale: number;
    mapBoundingBox: Rect;
    mapSize: Coord;
}

interface squadMarkerSizeSettings {
    name: string;
    radius: number;
    arrowDistance: number;
}

export {
  Coord, Rect, Platoon, Squad, warpgate, continent, ResolutionSettings, platoonHTMLElement,
  draggableHTMLElement, squadMarkerSizeSettings, MapMarker, mapMarkerHTMLElement,
};
