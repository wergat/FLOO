<template>
  <div
    v-show="showMarker"
    :id="`MarkerP${platoonIndex}S${squadIndex}`"
    class="squadMarker clickable"
    :style="[getSquadStyle, getPositionStyle]"
    @mousedown="onButtonDown"
    @mouseleave="setWindowsFocus(false)"
    @mouseenter="setWindowsFocus(true)"
  >
    <div :class="['squadMarkerLetter', `squadMarkerLetter${letter}`]">
      {{ letter }}
    </div>
    <div v-show="showArrows">
      <i
        v-for="n in 6"
        :id="`squadMarkerArrowP${platoonIndex}S${squadIndex}A${n-1}`"
        :key="n"
        class="arrow squadArrow"
        :style="getArrowStyle(n - 1)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Coord } from '../../assets/classes';
import MapElement from '../../map/MapElement';
import Interactable from '../../mixins/Interactable';

export default Vue.extend({
  name: 'MapSquadMarker',
  mixins: [MapElement, Interactable],
  props: {
    /** Squad Index */
    squadIndex: { type: Number, default: -1 },
    /** Platoon Index */
    platoonId: { type: Number, default: -1 },
  },

  data() {
    return {
      disabled: false,
      letter: 'A',
      /** Currently getting dragged around? */
      isDragging: false,
      /** Position at the start of the drag based on event.client */
      start: { x: 0, y: 0 },
      /** Position at the start of the dragging based on mapElements.ScreenPos */
      startPosition: { x: 0, y: 0 },
    };
  },
  computed: {
    platoonIndex() : number {
      return this.$store.getters.getPlatoonIndexByID(this.platoonId);
    },
    storedPosition() : Coord {
      return this.$store.getters.getSquadByID(this.platoonIndex, this.squadIndex).pos;
    },
    showMarker() : boolean {
      return !this.$store.getters.getSquadByID(this.platoonIndex, this.squadIndex).isEmpty;
    },
    showArrows() : boolean {
      return !this.$store.getters.getSquadByID(this.platoonIndex, this.squadIndex).isInPosition;
    },
    getSquadStyle() : any {
      const platoonData = this.$store.getters.getPlatoonByIndex(this.platoonIndex);
      const darker = platoonData.darkestColor;
      const normal = platoonData.color;
      const brighter = platoonData.lightestColor;

      const style = {
        backgroundColor: normal,
        background: '',
        borderColor: darker,
        transitionProperty: 'transform',
      };

      // If we are dragging, we want to use the temporary position to avoid recalculating the renderPos
      if (this.platoonId % 4 > 0) {
        const deg = 45 + this.platoonId * 70;
        const sizeA = 5 + ((this.platoonId * 3) % 7);
        const sizeB = 5 + ((this.platoonId * 4) % 7);
        style.background = `repeating-linear-gradient(${deg}deg, ${brighter}, ${brighter} ${sizeA}px,
         ${normal} ${sizeB}px, ${normal} ${sizeA + sizeB}px)`;
      } else {
        style.background = `repeating-radial-gradient(circle, ${brighter}, ${brighter} 10px, ${normal} 10px, ${normal} 20px)`;
      }

      if (this.isDragging) {
        style.transitionProperty = 'none';
      }
      return style;
    },
  },
  watch: {
    storedPosition: {
      handler():any { this.updateData(); },
      immediate: true,
    },
  },

  methods: {
    updateData(): void {
    // Get Platoon Data
      const platoonData = this.$store.getters.getPlatoonByIndex(this.platoonIndex);
      // Set the letter
      this.letter = ['?', 'A', 'B', 'C', 'D'][this.squadIndex + 1];
      // Call MapElements.setPosition to set the position of this element
      this.setPosition(platoonData.squads[this.squadIndex].pos.x, platoonData.squads[this.squadIndex].pos.y);
    },
    // TODO: turn this into computed property
    getArrowStyle(n: number) : any {
      const deg = (n * 60 - 135) % 360;
      const rad = deg * (Math.PI / 180);
      const rel = { x: 10, y: 10 };
      const size = 20;

      return {
        transform: `rotate(${n * (360 / 6)}deg)`,
        top: `${Math.sin(rad) * size + rel.x}px`,
        left: `${Math.cos(rad) * size + rel.y}px`,
      };
    },
    onButtonDown(event : MouseEvent) : void {
      if (this.disabled) { return; }
      event.preventDefault();
      // Init the dragging to setup all vars
      this.onDragStart(event);
      // Hook up the element to be draggable
      if (typeof window !== 'undefined') {
        document.addEventListener('mousemove', this.onDragging);
        document.addEventListener('mouseup', this.onDragEnd);
        document.addEventListener('contextmenu', this.onDragEnd);
      }
    },

    /**
     * Setting up the dragging
     */
    onDragStart(event : MouseEvent) : void {
      this.isDragging = true;
      this.start = { x: event.clientX, y: event.clientY };
      this.forcedScreenPos = this.screenPos;
      this.startPosition = this.screenPos;
      this.useForcedScreenPos = true;
    },

    /**
     * Gets called on mousemove or touchmvoe
     * Touchmove events gets parsed to act like mousemove event
     * */
    onDragging(event : MouseEvent) : void {
      if (this.isDragging) {
        // Calculate the total move delta vector and add that to the starting position
        // new positon = Start positon + distance moved
        this.forcedScreenPos = {
          x: this.startPosition.x + (event.clientX - this.start.x),
          y: this.startPosition.y + (event.clientY - this.start.y),
        };
      }
    },

    /**
     * Gets called on mouseup or contextmenu
   * ends the dragging of an map squad marker
   */
    onDragEnd(event: MouseEvent) : void {
      this.isDragging = false;
      this.setPositionAsOnScreen(this.forcedScreenPos.x, this.forcedScreenPos.y);
      // Check if we moved at all. If not => this was a click
      if (this.startPosition.x - this.forcedScreenPos.x === 0 && this.startPosition.y - this.forcedScreenPos.y === 0) {
        // Click
        this.$store.commit('setSquadMarkerArrowState', {
          pID: this.platoonId,
          sID: this.squadIndex,
          toggle: true,
        });
      } else {
        // Drag
        this.$store.commit('setSquadMarkerArrowState', {
          pID: this.platoonId, sID: this.squadIndex, toggle: false, value: event.shiftKey,
        });
      }
      this.$store.commit('setSquadPosition', {
        pID: this.platoonId, sID: this.squadIndex, xPos: this.mapPos.x, yPos: this.mapPos.y,
      });

      // End event hooks to keep performance high
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousemove', this.onDragging);
        document.removeEventListener('mouseup', this.onDragEnd);
        document.removeEventListener('contextmenu', this.onDragEnd);
      }
      this.useForcedScreenPos = false;
    },
  },
});
</script>
<style scoped>
.squadMarker {
  position: fixed;
  height: 34px;
  width: 34px;
  padding: 10px;

  border-radius: 20px;
  border: 2px solid black;

  cursor: pointer;

  font-size: 200%;
  text-transform: uppercase;
  color: #ddd;
  text-align: justify;
  text-decoration: none;
  -webkit-text-stroke-width: 1px;
  -webkit-text-stroke-color: black;
}

.squadMarkerLetter {
  user-select: none;
  position: relative;
  top: -17px;
}

.squadMarkerLetterA {
  left: -7px;
}

.squadMarkerLetterB {
  left: -4px;
}

.squadMarkerLetterC {
  left: -7px;
}

.squadMarkerLetterD {
  left: -5px;
}

.arrow {
  border: solid black;
  border-width: 0 3px 3px 0;
  display: inline-block;
  padding: 3px;
}

.squadArrow {
  border-color: white;
  position: absolute;
}

</style>
