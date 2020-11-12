// Requires camera so it can tell if it has to be rendered or not
import Camera from './Camera';
import { Coord } from '../assets/classes';

const MapElement = {
  props: {
    /** Offset used to center objects when rendering. Distance in X/Y from the topleft corner to center of object */
    renderOffset: Object,
    isDraggingCamera: Boolean,
    tracker: Object,
    skipFrameLimit: Number,
  },
  data(): any {
    return {
      mapPos: { x: 0, y: 0 },
      /** Position this mapSquadMarker is getting rendered at. We use this instead of MapElements.screenPos
       *  so we dont have to calculate to mapspace and back everytime we drag something */
      forcedScreenPos: { x: 0, y: 0 },
      useForcedScreenPos: false,
      dragStartScreenPos: { x: 0, y: 0 },
      skipFrameCounter: 0,
    };
  },
  created(): void {
    // Init the current value (TODO: Are you sure thats needed?)
    this.forcedScreenPos = this.screenPos;
  },
  watch: {
    isDraggingCamera(newVal: Boolean): void {
      if (newVal) {
        this.startDrag();
      } else {
        this.endDrag();
      }
    },
  },
  computed: {
    /** Gets the current position of this element on screenspace */
    screenPos(): Coord {
      if (this.useForcedScreenPos) {
        return this.forcedScreenPos;
      }
      return {
        x: Camera.invZoomFactor.x * (this.mapPos.x - Camera.onMapPos.x) - this.renderOffset.x,
        y: Camera.invZoomFactor.y * (this.mapPos.y - Camera.onMapPos.y) - this.renderOffset.y,
      };
    },

    /** Position used for the element style */
    getPositionStyle(): { transform: string, transitionDuration: string, transitionTimingFunction: string } {
      return {
        transform: `translate(${this.screenPos.x}px,${this.screenPos.y}px)`,
        transitionDuration: `${Camera.isZooming ? 200 : 25}ms`,
        transitionTimingFunction: Camera.isZooming ? 'ease' : 'linear',
      };
    },
  },
  methods: {
    // Starts dragging this element. Also used when the camera is being dragged
    // Changes rendering from
    startDrag(): void {
      this.dragStartScreenPos = this.screenPos;
      this.forcedScreenPos = { x: this.screenPos.x, y: this.screenPos.y };
      this.useForcedScreenPos = true;
      this.dragElement();
    },
    // Requires total drag delta as input
    dragElement(): void {
      this.skipFrameCounter += 1;
      if (this.skipFrameCounter > this.skipFrameLimit) {
        this.forcedScreenPos = {
          x: this.dragStartScreenPos.x - this.tracker.clampedDragMovement.x,
          y: this.dragStartScreenPos.y - this.tracker.clampedDragMovement.y,
        };
        this.skipFrameCounter = 0;
      }
      if (this.useForcedScreenPos) {
        window.requestAnimationFrame(this.dragElement);
      }
    },

    endDrag(): void {
      this.useForcedScreenPos = false;
    },
    /** Sets the position as if x and y are coordinates on the map
     * [0|0] = top left corner on map
     */
    setPosition(x: number, y: number): void {
      this.mapPos = { x, y };
    },

    /** Sets the position as if x and y were screen coordinates instead of coordinates on the map
     * [0|0] = top left corner of screen
     */

    setPositionAsOnScreen(x: number, y: number): void {
      this.mapPos = {
        x: Camera.zoomFactor.x * (x + this.renderOffset.x) + Camera.onMapPos.x,
        y: Camera.zoomFactor.y * (y + this.renderOffset.y) + Camera.onMapPos.y,
      };
    },

    /** Set the offset for the object when rendering it,
     *  so the rendered center is in center of object instead of top left corner
     * @param x X distance in px from the topleft corner to center of object
     * @param y Y distance in px from the topleft corner to center of object
     */
    setRenderOffset(x: number, y: number): void {
      this.renderOffset = { x, y };
    },
  },
};

export default MapElement;
