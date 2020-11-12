<template>
  <div id="MapContentBox">
    <map-squad-marker
      v-for="squad in allSquads"
      :key="`Squad${squad.squadID}P${squad.platoonID}`"
      :platoon-id="squad.platoonID"
      :squad-index="squad.squadID"
      :render-offset="{ x: 17, y: 17 }"
      :is-dragging-camera="tracker.isDraggingCamera"
      :tracker="tracker"
      :skip-frame-limit="5"
    />
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
import { mapGetters } from 'vuex';

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
    ...mapGetters(['allSquads']),
  },
  mounted() {
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
