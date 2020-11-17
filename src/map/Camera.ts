import Vue from 'vue';
import { Coord, Rect, ResolutionSettings } from '../assets/classes';
import { getResolution, getClosestResolutionID, getResolutionByID } from '../unsorted/ResolutionHandler';

/**
 * Genral info:
 * Map Space means the coordinates are on the in-game map itself
 * Screen Space means the coordinate are on the users screen
 */
const Camera = new Vue({
  data: {
    /** Top Left Corner of Camera, in map space */
    onMapPos: { x: 0, y: 0 },

    /** Current Zoom Level of Map, local use only */
    privateCurrentZoomLevel: 0,

    /** Factor for scaling resolution (0.75 for 1080p, 1 for 1440p etc) */
    resolutionScaleFactor: { x: 1, y: 1 },

    /** X Size of Continent */
    continentSize: { x: 1, y: 1 },

    /** Size of window/screen */
    windowSize: { x: 1, y: 1 },

    /** = getResolutionBoundingBox() : Bounding box for ingame map in screen space, assuming topLeft = (0|0) */
    screenSpaceCorners: { bottomRight: { x: 0, y: 0 }, topLeft: { x: 0, y: 0 } },

    /** Zoom level size factors */
    // TODO: Investigate if X and Y screen scale at the same pace
    factor: [1, 1.405,  2.103,  3.428,  6.228,  12.217, 17.98],
    // First calc:     [1, 1.4,    2.1,    3.415,  6.23,   12.15,  17.93],
    // Second calc:    [1, 1.4,    2.1,    3.425,  6.235,  12.24,  18],
    // 1080p calc:     [1, 1.405,  2.105,  3.428,  6.226,  12.22,  18],
    // 4k calc:        [1, 1.405,  2.103,  3.428,  6.228,  12.217, 17.98],
    /** Is the camera currently zooming? Used for animations, mostly */
    isZooming: false,
  },
  computed: {
    /** Current Zoom Level of Map */
    currentZoomLevel: {
      get() {
        return this.privateCurrentZoomLevel;
      },
      set(newLevel: number) {
        const level = { min: 0, max: 6 };
        if (newLevel < level.min) { newLevel = level.min; }
        if (newLevel > level.max) { newLevel = level.max; }
        this.privateCurrentZoomLevel = newLevel;
        this.isZooming = true;
        setTimeout(this.stopZooming, 200);
      },
    },

    /** Current Zoom Factor for X Axis */
    zoomFactor(): Coord {
      return {
        x: this.factor[this.currentZoomLevel] / this.resolutionScaleFactor.x,
        y: this.factor[this.currentZoomLevel] / this.resolutionScaleFactor.y,
      };
    },
    /** Inverted Zoom Factor for X Axis */
    invZoomFactor(): Coord {
      return {
        x: this.resolutionScaleFactor.x / this.factor[this.currentZoomLevel],
        y: this.resolutionScaleFactor.y / this.factor[this.currentZoomLevel],
      };
    },

    mapRenderSize(): Coord {
      return {
        x: this.windowSize.x * this.zoomFactor.x,
        y: this.windowSize.y * this.zoomFactor.y,
      };
    },

    mapSpaceCorners(): Rect {
      return {
        topLeft: {
          x: this.screenSpaceCorners.topLeft.x * this.zoomFactor.x,
          y: this.screenSpaceCorners.topLeft.y * this.zoomFactor.y,
        },
        bottomRight: {
          x: this.screenSpaceCorners.bottomRight.x * this.zoomFactor.x,
          y: this.screenSpaceCorners.bottomRight.y * this.zoomFactor.y,
        },
      };
    },
  },
  methods: {
    /** Sets isZooming to false */
    stopZooming(): void {
      this.isZooming = false;
    },
    /** Sets the top left position of the camer in screen space  */
    setCameraPosition(_x: any, _y: any): void {
      this.onMapPos = { x: _x, y: _y };
    },
    /** Clamps the camera to a position within the mapspaceCorners of the given map
     * @returns true if the position actually changed
    */
    clampCameraPosition(): boolean {
      const oldPos = { x: this.onMapPos.x, y: this.onMapPos.y };
      // Clamp Map Corner Position to Map Size Bounds
      this.onMapPos = this.clampMapCoordinates(this.onMapPos);
      return this.onMapPos === oldPos;
    },
    /** Helper function to clamp camera within bounds of mapspace
     * given coords, returns clapmed coords
     */
    clampMapCoordinates(posArg: Coord): Coord {
      const pos = { x: posArg.x, y: posArg.y };
      if (pos.x < -this.mapSpaceCorners.topLeft.x) {
        pos.x = -this.mapSpaceCorners.topLeft.x;
      }

      if (pos.y < -this.mapSpaceCorners.topLeft.y) {
        pos.y = -this.mapSpaceCorners.topLeft.y;
      }

      if (pos.x + this.mapSpaceCorners.bottomRight.x > this.continentSize.x) {
        pos.x = this.continentSize.x - this.mapSpaceCorners.bottomRight.x;
      }

      if (pos.y + this.mapSpaceCorners.bottomRight.y > this.continentSize.y) {
        pos.y = this.continentSize.y - this.mapSpaceCorners.bottomRight.y;
      }
      return pos;
    },
    /** Helper function to clamp camera within bounds of screenspace
     * given coords, returns clapmed coords
     */
    clampScreenCoordinates(posArg: Coord): Coord {
      const pos = { x: posArg.x, y: posArg.y };
      if (pos.x < -this.screenSpaceCorners.topLeft.x) {
        pos.x = -this.screenSpaceCorners.topLeft.x;
      }

      if (pos.y < -this.screenSpaceCorners.topLeft.y) {
        pos.y = -this.screenSpaceCorners.topLeft.y;
      }

      if (pos.x + this.screenSpaceCorners.bottomRight.x > this.continentSize.x) {
        pos.x = this.continentSize.x - this.screenSpaceCorners.bottomRight.x;
      }

      if (pos.y + this.screenSpaceCorners.bottomRight.y > this.continentSize.y) {
        pos.y = this.continentSize.y - this.screenSpaceCorners.bottomRight.y;
      }
      return pos;
    },
    /**
     * Handles zoom, like mouse wheel
     * @param xPos mouse xPos to zoom in/out in screenspace
     * @param yPos mouse yPos to zoom in/out in screenspace
     * @param zoom change of the zooom level
     * @returns true if the zoom level changed
     */
    handleZoom(xPos: number, yPos: number, zoom: number): boolean {
      // Mouse position (usually) to zoom in on
      const mousePos = { x: xPos, y: yPos };
      // Cache the old zoom level
      const oldLevel = this.currentZoomLevel;
      // Cache the prev render size of the map
      const prevMapRenderSize = { x: this.mapRenderSize.x, y: this.mapRenderSize.y };
      // Update the zoom level
      this.currentZoomLevel += zoom;
      // Return false and stop here if the level didnt actually change
      if (oldLevel === this.currentZoomLevel) { return false; }

      // Calculate mouse position relative to the whole screen (0|0) = Top Left Corner, (1|1) = Botto right corner
      const relativeMousePos = { x: (mousePos.x / this.windowSize.x), y: (mousePos.y / this.windowSize.y) };

      // Calculate new Camera Box depending on mouse position
      this.onMapPos.x = this.onMapPos.x + relativeMousePos.x * prevMapRenderSize.x - relativeMousePos.x * this.mapRenderSize.x;
      this.onMapPos.y = this.onMapPos.y + relativeMousePos.y * prevMapRenderSize.y - relativeMousePos.y * this.mapRenderSize.y;
      return true;
    },

    /** Loads given resolution settings into the camera */
    loadResolution(resoData: ResolutionSettings): void {
      this.windowSize = resoData.resolution;
      this.continentSize = resoData.mapSize;
      this.screenSpaceCorners = resoData.mapBoundingBox;
      this.resolutionScaleFactor = { x: resoData.resolutionScale, y: resoData.resolutionScale };
    },
  },
});

const detectedReso = getResolution();
const parentResoID = getClosestResolutionID(detectedReso);
const resoData = getResolutionByID(parentResoID);
Camera.loadResolution(resoData);
Camera.clampCameraPosition();

export default Camera;
