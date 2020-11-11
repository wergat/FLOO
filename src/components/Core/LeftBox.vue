<template>
  <div
    id="left-bounding-box"
    class="box clickable"
    :style="getBoxStyle"
    @mouseleave="setWindowsFocus(false)"
    @mouseenter="setWindowsFocus(true)"
  >
    <!-- Normal UI -->
    <div
      v-show="!showMoveUI"
      id="left-content-box"
      class="container"
    >
      <b-tabs
        id="left-box-content"
        v-model="activeContentTab"
        expanded
        type="is-toggle"
        :size="getSize"
      >
        <platoonListTab :enabled="settingsDone" />
        <settingsTab @settingsDone="settingsDone = $event" />
      </b-tabs>
    </div>

    <!-- Move this element UI -->
    <div
      v-show="showMoveUI"
      class="moveUIContainer"
      :style="{width: `${width}px`, height: `${height}px`}"
      @mousedown="onDragStart"
    >
      <div
        class="level"
        :style="{height:'100%'}"
      >
        <p class="level-item has-text-centered">
          <span class="icon">
            <i
              class="fas fa-arrows-alt fa-3x"
              :style="{fontSize: `${UISize + 3}em`}"
            />
          </span>
        </p>
      </div>

      <b-button
        :style="{top:'-100px'}"
        :size="getSize"
        icon-left="check"
        type="is-success"
        @click="submitWindowPosiions"
      />
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';

import UIColor from '../../mixins/UIColor';
import { clamp } from '../../unsorted/Utils';
import { loadSetting, saveSettings } from '../../unsorted/StoreHandler';
import Camera from '../../map/Camera';
import PlatoonListTab from '../Platoons/PlatoonListTab.vue';
import SettingsTab from './SettingsTab.vue';
import Interactable from '../../mixins/Interactable';

interface LeftBoxStyle {
  width: string;
  padding: string;
  top?: string;
  borderTop?: string;
  bottom?: string;
  borderBottom?: string;
  left?: string;
  borderLeft?: string;
  right?: string;
  borderRight?: string;
}

// Create
export default Vue.extend({
  name: 'LeftBox',
  components: { PlatoonListTab, SettingsTab },
  mixins: [Interactable, UIColor],
  data() {
    return {
      // Currently open Tab
      activeContentTab: 1,
      // All Settings set?
      settingsDone: false,
      // If true, shows the move UI instead of the normal UI
      showMoveUI: false,
      // Position, etc of the window, used when moving it around
      width: 0,
      height: 0,
      top: 400,
      bottom: 0,
      left: 0,
      right: 0,
      snapLeft: true,
      snapTop: true,
      oldDragPos: { x: 0, y: 0 },
    };
  },
  computed: {
    ...mapGetters(['isMovingUI', 'UISize']),
    getSize(): string {
      const arr = ['small', 'normal', 'medium', 'large'];
      return `is-${arr[clamp(this.UISize, 0, 3)]}`;
    },
    getBoxStyle(): LeftBoxStyle {
      const base: LeftBoxStyle = {
        width: `${400 + this.UISize * 100}px`,
        padding: `${Math.max(0.75 + this.UISize * 0.5, 0)}rem`,
      };
      if (this.snapTop) {
        base.top = `${this.top}px`;
        if (this.isMovingUI) {
          base.borderTop = '6px solid red';
        }
      } else {
        base.bottom = `${this.bottom}px`;
        if (this.isMovingUI) {
          base.borderBottom = '6px solid red';
        }
      }
      if (this.snapLeft) {
        base.left = `${this.left}px`;
        if (this.isMovingUI) {
          base.borderLeft = '6px solid red';
        }
      } else {
        base.right = `${this.right}px`;
        if (this.isMovingUI) {
          base.borderRight = '6px solid red';
        }
      }
      return base;
    },
  },
  watch: {
    isMovingUI(newVal: boolean): void {
      const ele = document.getElementById('left-content-box');
      if (ele) {
        const style = window.getComputedStyle(ele);
        this.width = parseInt(style.width, 10);
        this.height = parseInt(style.height, 10);
        this.showMoveUI = newVal;
      }
    },
  },
  mounted() {
    const loaded = loadSetting('leftBoxPos');
    if (loaded) {
      this.top = loaded.top;
      this.left = loaded.left;
      this.snapLeft = loaded.snapLeft;
      this.snapTop = loaded.snapTop;
    }
  },
  methods: {
    submitWindowPosiions(): void {
      this.$store.commit('setMovingUI', false);
    },
    onDragStart(event: MouseEvent): void {
      this.oldDragPos.x = event.clientX;
      this.oldDragPos.y = event.clientY;

      const ele = document.getElementById('left-bounding-box');
      if (ele) {
        const style = window.getComputedStyle(ele);
        this.top = parseInt(style.top, 10);
        this.left = parseInt(style.left, 10);
        this.bottom = parseInt(style.bottom, 10);
        this.right = parseInt(style.right, 10);
      }

      document.addEventListener('mousemove', this.onDragging);
      document.addEventListener('mouseup', this.onDragEnd);
    },
    onDragging(event: MouseEvent): void {
      const delta = {
        x: this.oldDragPos.x - event.clientX,
        y: this.oldDragPos.y - event.clientY,
      };
      this.left -= delta.x;
      this.top -= delta.y;
      this.right += delta.x;
      this.bottom += delta.y;

      // Snapping
      if (this.left <= 0) {
        this.snapLeft = true;
        this.left = 0;
      }
      if (this.top <= 0) {
        this.snapTop = true;
        this.top = 0;
      }
      if (this.left + this.width >= Camera.windowSize.x || this.right <= 0) {
        this.snapLeft = false;
        this.right = 0;
      }
      if (this.top + this.height >= Camera.windowSize.y || this.bottom <= 0) {
        this.snapTop = false;
        this.bottom = 0;
      }
      this.oldDragPos.x = event.clientX;
      this.oldDragPos.y = event.clientY;
    },
    onDragEnd(): void {
      document.removeEventListener('mousemove', this.onDragging);
      document.removeEventListener('mouseup', this.onDragEnd);
      saveSettings('leftBoxPos', {
        top: this.top,
        left: this.left,
        snapLeft: this.snapLeft,
        snapTop: this.snapTop,
      });
    },
  },
});
</script>
<style>
.moveUIContainer {
  background-color: lightgray;
  border-radius: 6px;
}

#left-bounding-box {
  position: absolute;
}

#left-box-content > section {
  padding: 0 !important;
}
</style>
