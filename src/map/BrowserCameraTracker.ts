import Vue from 'vue';
import isElectron from 'is-electron';
import Camera from './Camera';
import store from '../store/index';

/** Tracks movement done on the game map using MouseEvent and KeyEvent emmited using iohook */
const Tracker = new Vue({
  store,
  data() {
    return {
      dragStartPosition: { x: 0, y: 0 },
      relativeCamPositionToDragStart: { x: 0, y: 0 },
      lastDragPosition: { x: 0, y: 0 },
      dragMovement: { x: 0, y: 0 },
      // Clamped version of above, used when moving elements out of bounds when movign the camera is not wanted
      clampedDragMovement: { x: 0, y: 0 },
      // Are we in an electron instance right now?
      isElectron: false,
      // Can we drag the map around right now? TODO: Really needed?
      canDragMap: false,
      // Is the handling of events currently enabled?
      isHandlingEnabled: true,
      // Currently dragging camera?
      isDraggingCamera: false,
      // used to prevent mass polling of mouse move
      hasNewEvent: false,
      newEvent: { type: MouseEvent },
    };
  },
  methods: {
    start(): void {
      if (!isElectron()) {
        console.log('Browser detected');
        document.addEventListener('mousemove', this.newMoveEvent);
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('mousedown', this.handleMouseDown);
        document.addEventListener('wheel', this.handleMouseWheel);
      } else {
        console.log('Electron detected');
        this.isElectron = true;
      }
      setInterval(this.checkMoveEvent, 25);
    },

    handleMouseDown(event: any): void {
      // Check if we click on an element we want to click on
      // We are using any above, but its acutally mouseEvent
      // For some reason the linter doesnt know event.target.className exists
      if (event.target.className) {
        return;
      }
      // Left Click
      if (event.button === 0) {
        // Reset all drag coordinates and tracked vectors etc
        this.dragMovement = { x: 0, y: 0 };
        this.clampedDragMovement = { x: 0, y: 0 };
        this.dragStartPosition = { x: Camera.zoomFactor.x * event.clientX, y: Camera.zoomFactor.y * event.clientX };
        this.relativeCamPositionToDragStart = {
          x: Camera.onMapPos.x - this.dragStartPosition.x,
          y: Camera.onMapPos.y - this.dragStartPosition.y,
        };
        this.lastDragPosition = { x: event.clientX, y: event.clientY };

        // If we are hovering over the map and are not dragging something around right now,
        // drag the map if we drag the mouse around TODO: Add actual area for map to be checked against, so you dont drag stuff from offscreen
        if (this.$store.getters.isGameFocused) {
          this.isDraggingCamera = true;
        }
      }
    },

    newMoveEvent(event: MouseEvent): void {
      this.hasNewEvent = true;
      this.newEvent = event;
    },

    checkMoveEvent(): void {
      if (this.hasNewEvent) {
        this.handleMapDrag(this.newEvent);
        this.hasNewEvent = false;
      }
    },

    /** Handles the map and camera positions when the camera gets dragged around */
    handleMapDrag(event: MouseEvent): void {
      if (this.isDraggingCamera) {
        // Calculate the camera movement based on camera render size (zoom) and drag delta
        // Summing the total distance moved from the start position
        this.dragMovement.x += this.lastDragPosition.x - event.clientX;
        this.dragMovement.y += this.lastDragPosition.y - event.clientY;

        const camPos = {
          x: this.dragStartPosition.x + Camera.zoomFactor.x * this.dragMovement.x + this.relativeCamPositionToDragStart.x,
          y: this.dragStartPosition.y + Camera.zoomFactor.y * this.dragMovement.y + this.relativeCamPositionToDragStart.y,
        };
        const clampPos = Camera.clampMapCoordinates(camPos);
        this.clampedDragMovement.x = (clampPos.x - this.dragStartPosition.x - this.relativeCamPositionToDragStart.x) * Camera.invZoomFactor.x;
        this.clampedDragMovement.y = (clampPos.y - this.dragStartPosition.y - this.relativeCamPositionToDragStart.y) * Camera.invZoomFactor.y;

        // Update position of last drag so we know how far we dragged the next time around
        this.lastDragPosition = { x: event.clientX, y: event.clientY };
      }
    },

    handleMouseUp(event: MouseEvent): void {
      if (this.isDraggingCamera) {
        // Save Camera settings
        Camera.setCameraPosition(
          this.dragStartPosition.x + Camera.zoomFactor.x * this.dragMovement.x + this.relativeCamPositionToDragStart.x,
          this.dragStartPosition.y + Camera.zoomFactor.y * this.dragMovement.y + this.relativeCamPositionToDragStart.y,
        );

        Camera.clampCameraPosition();
      }
      if (event.button === 0) {
        this.isDraggingCamera = false;
      }
    },

    handleMouseWheel(scrollEvent: WheelEvent): void {
      if (this.isDraggingCamera) { return; }
      // Update the camera when we zoom. Update the other stuff only if zoom actually changed
      // Also clamp the deltaY to [-1,1] to prevent too fast scrolling.
      if (Camera.handleZoom(scrollEvent.clientX, scrollEvent.clientY, Math.sign(scrollEvent.deltaY))) {
        // Clamp Camera Position in case we scrolled out of bounds somehow
        Camera.clampCameraPosition();
      }
    },
  },

});
export default Tracker;
