<template>
  <div
    v-show="!isMinimized"
    id="MapContentBox"
  >
    <div
      v-for="platoonIndex in $store.getters.getPlatoonCount"
      :key="platoonIndex"
    >
      <map-squad-marker
        v-for="squadID in 4"
        :key="squadID"
        :platoon="(platoonIndex - 1)"
        :squad="(squadID - 1)"
        :render-offset="{ x: 17, y: 17 }"
        :is-dragging-camera="tracker.isDraggingCamera"
        :tracker="tracker"
        :skip-frame-limit="5"
      />
    </div>
    <map-bounding-box
      :render-offset="{ x:0, y:0 }"
      :is-dragging-camera="tracker.isDraggingCamera"
      :tracker="tracker"
      :skip-frame-limit="5"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import MapSquadMarker from '../Platoons/MapSquadMarker.vue';
import MapBoundingBox from './MapBoundingBox.vue';
import Tracker from '../../map/Tracker';

import continentData from '../../unsorted/ContinentData.json';

export default Vue.extend({
  components: { MapSquadMarker, MapBoundingBox },
  data() {
    return {
      tracker: Tracker.get(),
    };
  },
  computed: {
    allSquads() : any {
      const squads : Object[] = [];
      for (let i = 0; i < this.$store.getters.getPlatoonCount; i++) {
        squads.concat(squads, this.$store.getters.getPlatoonByID(i).squads);
      }
      return squads;
    },
    isMinimized(): boolean {
      return this.$store.getters.isMinimized;
    },
  },
  mounted() {
    if (this.$store.getters.getPlatoonByID(0).id === -1) {
      this.$store.commit('removePlatoon', -1);
    }
    this.$store.commit('setContinentData', continentData);
  },
});
</script>
<style>
#MapContentBox {
  position: absolute;
  top: 0px;
  left: 0px;
}
</style>
