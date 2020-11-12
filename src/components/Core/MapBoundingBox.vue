<template>
  <div
    id="MapBoundsBox"
    :style="[getSquadStyle, getPositionStyle]"
  />
</template>

<script lang="ts">
import Vue from 'vue';
import MapElement from '../../map/MapElement';
import Camera from '../../map/Camera';

export default Vue.extend({
  name: 'MapBoundingBox',
  mixins: [MapElement],
  computed: {
    getSquadStyle() :any {
      const zoomFactor = Camera.invZoomFactor;
      const mapBoxSize = Camera.continentSize;
      const style = {
        width: `${zoomFactor.x * mapBoxSize.x}px`,
        height: `${zoomFactor.x * mapBoxSize.y}px`,
      };
      return style;
    },
  },
  created() {
    this.setPosition(0, 0);
  },
});
</script>
<style scoped>
#MapBoundsBox {
  border: 5px solid black;
  position: fixed;
  z-index: -10;
}
</style>
