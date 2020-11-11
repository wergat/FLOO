<template>
  <div
    class="box"
    draggable="true"
  >
    {{ cameraPosString }}
    <b-button
      icon-right="search-plus"
      @click="zoomIn"
    />
    <b-button
      icon-right="search-minus"
      @click="zoomOut"
    />
    {{ trackerString }}
  </div>
</template>

<script lang="ts">
import Camera from '../../map/Camera';
import Tracker from '../../map/Tracker';

export default {
  name: 'DebugCamera',
  data() : any {
    return {
      cam: Camera,
      tracker: Tracker.get(),
    };
  },
  computed: {
    cameraPosString() : string {
      return `Camera @: 
      Map: [${(Camera.onMapPos.x).toFixed(2)}|${(Camera.onMapPos.y).toFixed(2)}] of 
      [${(Camera.mapSpaceCorners.topLeft.x).toFixed(2)}|${(Camera.mapSpaceCorners.topLeft.y).toFixed(2)}]
      Screen: [${(Camera.onMapPos.x * -Camera.invZoomFactor.x).toFixed(2)}|${(Camera.onMapPos.y * -Camera.invZoomFactor.y).toFixed(2)}] of
      [${(Camera.screenSpaceCorners.topLeft.x).toFixed(2)}|${(Camera.screenSpaceCorners.topLeft.y).toFixed(2)}], 
      Focus: ${this.$store.getters.isGameFocused}`;
    },
    trackerString() : string {
      return `Drag : Dragging: ${this.tracker.isDraggingCamera},
      [${this.tracker.dragMovement.x}|${this.tracker.dragMovement.y}] \n
      From [${this.tracker.dragStartPosition.x}|${this.tracker.dragStartPosition.y}]
      `;
    },
  },
  methods: {
    zoomIn() : void {
      Camera.currentZoomLevel -= 1;
    },
    zoomOut() : void {
      Camera.currentZoomLevel += 1;
    },
    moveCam(x: number, y : number) : void {
      Camera.onMapPos = { x: Camera.onMapPos.x + x, y: Camera.onMapPos.y + y };
    },
  },
};
</script>

<style>

</style>
