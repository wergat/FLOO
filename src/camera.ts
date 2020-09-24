import { coord, rect, Platoon, Squad, warpgate, continent, resolutionSettings, PlatoonHTMLElement, importContinentData, importResolutionSettings } from "./data";

class cameraClass {
    //   Constants
    /** Top Left Corner of Camera */
    onMapPos: coord = { x: 0, y: 0 };
    /** Current Zoom Level of Map */
    currentZoomLevel = 0;
    /** Zoom level resrictions */
    level = { min: 0, max: 6, resetMin: 0, resetMax: 4 }
    /** Zoom level size factors */
    factor = [1, 1.4, 2.1, 3.425, 6.235, 12.24, 18];
    // First Calc: [1,1.4   ,2.1 ,3.415, 6.23, 12.15, 17.93];
    // Second Calc: [1, 1.4, 2.1, 3.425, 6.235, 12.24, 18]
    // Values 1-3 should be accurate.

    /** Current Zoom Factor
     *  mapRenderSize / windowSize = this.zoomFactor
     */
    zoomFactor = 1;
    /** 1 / Current Zoom Factor
     * windowSize / mapRenderSize = this.invZoomFactor
     */
    invZoomFactor = 1;

    /** Size Of Map Rendered */
    mapRenderSize: coord = { x: 0, y: 0 };
    /** Size of window */
    windowSize: coord = { x: 0, y: 0 };

    /** = getResolutionBoundingBox() : Bounding box for ingame map in screen space, assuming topLeft = (0|0)*/
    screenSpaceCorners: rect;
    /** Size of the currently selected continent */
    continentSize: coord;
    /** screenSpaceCorners based on mapspace instead of screenspace + current camera position*/
    mapSpaceCorners: rect;

    getCurrentPositionOnMap(): coord {
        return this.onMapPos;
    }

    /** Sets the current zoom level to $newLevel after clamping it to [level.min,level.max] */
    setZoomLevel(newLevel: number) {
        if (newLevel < this.level.min) { newLevel = this.level.min };
        if (newLevel > this.level.max) { newLevel = this.level.max };
        this.currentZoomLevel = newLevel;
    }

    /** Max Size of map that could be rendered, changed by zooming in/out */
    setMapRenderSize(_x: number, _y: number) {
        this.mapRenderSize = {x: _x, y: _y};
    }

    setWindowSize(_x: number, _y: number) {
        this.windowSize = {x: _x, y: _y};
    }

    /** Does not clamp the camera position */
    setCamerPosition(_x: number, _y: number): void;
    setCamerPosition(_x: coord, _y: void): void;
    setCamerPosition(_x: any, _y: any) {
        if (_y == null) {
            this.onMapPos = _x;
        } else {
            this.onMapPos = { x: _x, y: _y }
        }
    }

    setScreenSpaceCorners(_screenSpaceCorners: rect) {
        this.screenSpaceCorners = _screenSpaceCorners;
        this.recalculateMapSpaceCorners();
    }

    /** Updates the size of the continent for the camera */
    setContinentSize(_x: number, _y: number) {
        this.continentSize = {x: _x, y: _y};
    }

    /** Updates mapSpaceCorners based on current screenspace corners and zoom level */
    recalculateMapSpaceCorners() {
        let _topLeft = { x: this.screenSpaceCorners.topLeft.x * this.zoomFactor, y: this.screenSpaceCorners.topLeft.y * this.zoomFactor };
        let _bottomRight = { x: this.screenSpaceCorners.bottomRight.x * this.zoomFactor, y: this.screenSpaceCorners.bottomRight.y * this.zoomFactor };
        this.mapSpaceCorners = { topLeft: _topLeft, bottomRight: _bottomRight };
    }

    /** windowSize / mapRenderSize = this.invZoomFactor */
    getScreenPerMapPixel(): number {
        return this.invZoomFactor;

    }

    /** mapRenderSize / windowSize = this.zoomFactor*/
    getMapPerScreenPixel(): number {
        return this.zoomFactor;
    }

    ClampCameraPosition() {
        //var continentSize = getCurrentContinentSize();

        let didReset = false;
        // Clamp Map Corner Position to Map Size Bounds
        if (this.onMapPos.x < -this.mapSpaceCorners.topLeft.x) { this.onMapPos.x = -this.mapSpaceCorners.topLeft.x; didReset = true; }
        if (this.onMapPos.y < -this.mapSpaceCorners.topLeft.y) { this.onMapPos.y = -this.mapSpaceCorners.topLeft.y; didReset = true; }

        if (this.onMapPos.x + this.mapSpaceCorners.bottomRight.x > this.continentSize.x) { this.onMapPos.x = this.continentSize.x - this.mapSpaceCorners.bottomRight.x; didReset = true; }
        if (this.onMapPos.y + this.mapSpaceCorners.bottomRight.y > this.continentSize.y) { this.onMapPos.y = this.continentSize.y - this.mapSpaceCorners.bottomRight.y; didReset = true; }

        return didReset;
    }

    /** Handles the mousewheel on zoom in/out
     * DOES NOT clamp the position afterwards
     */
    handleMouseWheel(message: any) {
        let mousePos = { x: message.x, y: message.y };
        this.currentZoomLevel += message.rotation;
        this.setZoomLevel(this.currentZoomLevel);
        let prevMapRenderSize = { x: this.mapRenderSize.x, y: this.mapRenderSize.y }

        // Update the zoom factors
        this.zoomFactor = this.factor[this.currentZoomLevel];
        this.invZoomFactor = 1 / this.factor[this.currentZoomLevel];


        this.mapRenderSize = { x: this.windowSize.x * this.zoomFactor, y: this.windowSize.y * this.zoomFactor }

        let relativeMousePos = { x: (mousePos.x / this.windowSize.x), y: (mousePos.y / this.windowSize.y) }

        // Calculate new Camera Box depending on mouse position
        this.onMapPos.x = this.onMapPos.x + relativeMousePos.x * prevMapRenderSize.x - relativeMousePos.x * this.mapRenderSize.x
        this.onMapPos.y = this.onMapPos.y + relativeMousePos.y * prevMapRenderSize.y - relativeMousePos.y * this.mapRenderSize.y

        // Update the mapspace corners
        this.recalculateMapSpaceCorners()
    }

    //** Centers the map on a map space position. */
    centerMapOnPosition(xPos: number, yPos: number) {
        // Move Center of Camera to the selected warpgate
        this.onMapPos.x = xPos - (this.mapRenderSize.x / 2);
        this.onMapPos.y = yPos - (this.mapRenderSize.y / 2);
    }
}

const camera: cameraClass = new cameraClass();
export default camera;