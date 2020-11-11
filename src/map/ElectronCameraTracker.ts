/* eslint @typescript-eslint/no-var-requires: "off" */
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
      isElectron: true,
      // Can we drag the map around right now? TODO: Really needed?
      canDragMap: false,
      // Is the handling of events currently enabled?
      isHandlingEnabled: true,
      // Currently dragging camera?
      isDraggingCamera: false,
    };
  },
  methods: {
    start() {
      if (isElectron()) {
        /* eslint-disable global-require */
        const { ipcRenderer } = window.require('electron');
        /* eslint-enable global-require */
        console.log('Electron detected');
        ipcRenderer.on('mousedown', (event, message) => { this.handleMouseDown(message); });
        ipcRenderer.on('mouseup', (event, message) => { this.handleMouseUp(message); });
        ipcRenderer.on('mousewheel', (event, message) => { this.handleMouseWheel(message); });
        ipcRenderer.on('mousedrag', (event, message) => { this.handleMouseDrag(message); });

        ipcRenderer.on('KeyEvent', (event, message) => {
          this.handleRendererKeyEvent(message);
        });
      } else {
        console.log('Electron not detected');
        this.isElectron = false;
      }
    },

    handleMouseDown(message: any): void {
      // Left Click
      if (message.button === 1) {
        // Reset all drag coordinates and tracked vectors etc
        this.dragMovement = { x: 0, y: 0 };
        this.clampedDragMovement = { x: 0, y: 0 };
        this.dragStartPosition = { x: Camera.zoomFactor.x * message.x, y: Camera.zoomFactor.y * message.y };
        this.relativeCamPositionToDragStart = {
          x: Camera.onMapPos.x - this.dragStartPosition.x,
          y: Camera.onMapPos.y - this.dragStartPosition.y,
        };
        this.lastDragPosition = { x: message.x, y: message.y };

        // If we are hovering over the map and are not dragging something around right now,
        // drag the map if we drag the mouse around TODO: Add actual area for map to be checked against, so you dont drag stuff from offscreen
        if (this.$store.getters.isGameFocused) {
          this.isDraggingCamera = true;
        }
      }
    },

    /** Handles the map and camera positions when the camera gets dragged around */
    handleMouseDrag(message: any): void {
      if (this.isDraggingCamera) {
        // Calculate the camera movement based on camera render size (zoom) and drag delta
        // Summing the total distance moved from the start position
        this.dragMovement.x += this.lastDragPosition.x - message.x;
        this.dragMovement.y += this.lastDragPosition.y - message.y;

        const camPos = {
          x: this.dragStartPosition.x + Camera.zoomFactor.x * this.dragMovement.x + this.relativeCamPositionToDragStart.x,
          y: this.dragStartPosition.y + Camera.zoomFactor.y * this.dragMovement.y + this.relativeCamPositionToDragStart.y,
        };
        const clampPos = Camera.clampMapCoordinates(camPos);
        this.clampedDragMovement.x = (clampPos.x - this.dragStartPosition.x - this.relativeCamPositionToDragStart.x) * Camera.invZoomFactor.x;
        this.clampedDragMovement.y = (clampPos.y - this.dragStartPosition.y - this.relativeCamPositionToDragStart.y) * Camera.invZoomFactor.y;

        // Update position of last drag so we know how far we dragged the next time around
        this.lastDragPosition = { x: message.x, y: message.y };
      }
    },

    handleMouseUp(message: any): void {
      if (this.isDraggingCamera) {
        // Save Camera settings
        Camera.setCameraPosition(
          this.dragStartPosition.x + Camera.zoomFactor.x * this.dragMovement.x + this.relativeCamPositionToDragStart.x,
          this.dragStartPosition.y + Camera.zoomFactor.y * this.dragMovement.y + this.relativeCamPositionToDragStart.y,
        );
        // Clamp the real camera so we can only look at one continent at a time ;)
        Camera.clampCameraPosition();
      }
      if (message.button === 1) {
        this.isDraggingCamera = false;
      }
    },

    handleMouseWheel(message: any): void {
      if (this.isDraggingCamera) { return; }
      // Update the camera when we zoom. Update the other stuff only if zoom actually changed
      if (Camera.handleZoom(message.x, message.y, message.rotation)) {
        // Clamp Camera Position in case we scrolled out of bounds somehow
        Camera.clampCameraPosition();
      }
    },

    handleRendererKeyEvent(): void {
      // Not used right now. TODO: Detect use of [Space], center cam on player
    },

  },

});
export default Tracker;
