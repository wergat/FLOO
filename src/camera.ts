import { coord, rect } from "./classes"
import data from "./data";

class Camera {
    //   Constants
    /** Top Left Corner of Camera, in map space */
    onMapPos: coord = { x: 0, y: 0 };
    /** Current Zoom Level of Map */
    currentZoomLevel = 0;
    /** Zoom level resrictions */
    level = { min: 0, max: 6, resetMin: 0, resetMax: 4 }
    /** Zoom level size factors */
    // TODO: Investigate if X and Y screen scale at the same pace
    factor = [1, 1.4, 2.1, 3.425, 6.235, 12.24, 18];

    // First calc:  [1, 1.4,    2.1,    3.415,  6.23,   12.15,  17.93];
    // Second calc: [1, 1.4,    2.1,    3.425,  6.235,  12.24,  18];
    // 1080p calc:  [1, 1.405,  2.105,  3.428,  6.226,  12.22,  18];
    // Values 1-3 should be accurate OR ARE THEY.

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

    /** Factor for scaling resolution */
    resolutionScaleFactor = 1;//0.75;

    /** Returs the current camera position (top left corner) in map space */
    getCurrentPosition(): coord {
        return this.onMapPos;
    }

    /** Sets the current zoom level to $newLevel after clamping it to [level.min,level.max] */
    setZoomLevel(newLevel: number) {
        if (newLevel < this.level.min) { newLevel = this.level.min };
        if (newLevel > this.level.max) { newLevel = this.level.max };
        this.currentZoomLevel = newLevel;
    }

    /** Sets the default starting settings for window of size [_x,_y]*/
    initSetWindowSize(_x: number, _y: number) {
        this.setMapRenderSize(_x, _y);
        this.setWindowSize(_x, _y);
    }

    /** Max Size of map that could be rendered, changed by zooming in/out */
    setMapRenderSize(_x: number, _y: number) {
        this.mapRenderSize = { x: _x, y: _y };
    }

    setWindowSize(_x: number, _y: number) {
        this.windowSize = { x: _x, y: _y };
    }

    /** Sets the top left position of the camer in screen space  */
    setCameraPosition(_x: any, _y: any) {
        this.onMapPos = { x: _x, y: _y }
    }

    /** Sets the corners where the camera can move to. Most noticable when fully zoomed out. 
     * Prevents the cam from going too far away from the continent */
    setScreenSpaceCorners(_screenSpaceCorners: rect) {
        this.screenSpaceCorners = _screenSpaceCorners;
        this.recalculateMapSpaceCorners();
    }

    /** Updates the size of the continent for the camera */
    setContinentSize(_x: number, _y: number) {
        this.continentSize = { x: _x, y: _y };
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

    clampCameraPosition() {
        //var continentSize = getCurrentContinentSize();

        let didReset = false;
        // Clamp Map Corner Position to Map Size Bounds
        if (this.onMapPos.x < -this.mapSpaceCorners.topLeft.x) { this.onMapPos.x = -this.mapSpaceCorners.topLeft.x; didReset = true; }
        if (this.onMapPos.y < -this.mapSpaceCorners.topLeft.y) { this.onMapPos.y = -this.mapSpaceCorners.topLeft.y; didReset = true; }

        if (this.onMapPos.x + this.mapSpaceCorners.bottomRight.x > this.continentSize.x) { this.onMapPos.x = this.continentSize.x - this.mapSpaceCorners.bottomRight.x; didReset = true; }
        if (this.onMapPos.y + this.mapSpaceCorners.bottomRight.y > this.continentSize.y) { this.onMapPos.y = this.continentSize.y - this.mapSpaceCorners.bottomRight.y; didReset = true; }

        return didReset;
    }

    /** Updates the zoom factors based on resolution scaling and current zoom level*/
    updateZoomFactors() {
        this.zoomFactor = this.factor[this.currentZoomLevel] / this.resolutionScaleFactor;
        this.invZoomFactor = 1 / (this.factor[this.currentZoomLevel] / this.resolutionScaleFactor);
    }

    /** Handles the mousewheel on zoom in/out
     * DOES NOT clamp the position afterwards
     * @returns true if zoom level was changed
     */
    handleMouseWheel(message: any): boolean {
        let mousePos = { x: message.x, y: message.y };
        let oldLevel = this.currentZoomLevel;
        this.setZoomLevel(this.currentZoomLevel + message.rotation);
        if (oldLevel == this.currentZoomLevel) {
            return false;
        }

        let prevMapRenderSize = { x: this.mapRenderSize.x, y: this.mapRenderSize.y }

        // Update the zoom factors
        this.updateZoomFactors();


        this.mapRenderSize = { x: this.windowSize.x * this.zoomFactor, y: this.windowSize.y * this.zoomFactor }

        let relativeMousePos = { x: (mousePos.x / this.windowSize.x), y: (mousePos.y / this.windowSize.y) }

        // Calculate new Camera Box depending on mouse position
        this.onMapPos.x = this.onMapPos.x + relativeMousePos.x * prevMapRenderSize.x - relativeMousePos.x * this.mapRenderSize.x
        this.onMapPos.y = this.onMapPos.y + relativeMousePos.y * prevMapRenderSize.y - relativeMousePos.y * this.mapRenderSize.y

        // Update the mapspace corners
        this.recalculateMapSpaceCorners();
        return true;
    }

    //** Centers the map on a map space position. */
    centerMapOnPosition(xPos: number, yPos: number) {
        // Move Center of Camera to the selected warpgate
        this.onMapPos.x = xPos - (this.mapRenderSize.x / 2);
        this.onMapPos.y = yPos - (this.mapRenderSize.y / 2);
    }

    /** Centers the camera on the currently selected warpgate position, then clamps the camera
     * 
     * DOES NOT RERENDER AFTERWARDS
    */
    centerCamOnWarpgate() {
        this.centerMapOnPosition(data.getCurrentWarpgate().x, data.getCurrentWarpgate().y);
        this.clampCameraPosition();
    }


}


export default new Camera();