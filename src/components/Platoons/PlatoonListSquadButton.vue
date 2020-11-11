<template>
  <b-button
    :style="getStyleElement()"
    :size="getSize()"
    @click.ctrl.stop="toggleSquadDelete()"
    @click.shift.stop="toggleSquadArrival()"
  >
    {{ letter }}
  </b-button>
</template>

<script lang="ts">
import Vue from 'vue';
import Color from 'color';

export default Vue.extend({
  name: 'PlatoonListSquadButton',
  components: {},
  props: {
    platoonId: { type: Number, default: 0 },
    squadId: { type: Number, default: 0 },
    platoonObject: { type: Object, default: undefined },
    letter: { type: String, default: '?' },
  },
  data() {
    return {};
  },
  computed: {
    UISize() : number {
      return this.$store.getters.UISize;
    },
  },
  methods: {
    isDark(color: string): boolean {
      return Color(color).isDark();
    },

    getSize():string {
      const arr = ['small', 'normal', 'medium', 'large'];
      return `is-${arr[Math.min(Math.max(this.UISize, 0), 3)]}`;
    },

    getStyleElement() : {margin: string, color: string, background?: string, borderColor?: string,
     backgroundColor?: string, paddingLeft?: string, paddingRight?: string} {
      const { isEmpty } = this.platoonObject.squads[this.squadId];
      const light = this.platoonObject.lightColor;
      const normal = this.platoonObject.color;
      const isDark = this.isDark(normal);
      const darkest = this.platoonObject.darkestColor;
      const style : {margin: string, color: string, background?: string, borderColor?: string,
     backgroundColor?: string, paddingLeft?: string, paddingRight?: string} = {
       margin: `${Math.max(0.1 + this.UISize * 0.1, 0)}rem`, color: 'black',
     };
      // If is striped == existing and moving == not empty and not in posiion
      if (!this.platoonObject.squads[this.squadId].isInPosition && !isEmpty) {
        style.color = 'black';
        style.background = `repeating-linear-gradient(45deg, ${light}, ${light} 5px, transparent 5px, transparent 10px)`;
        style.borderColor = darkest;
      } else {
        style.color = isDark && !isEmpty ? 'white' : 'black';
        style.backgroundColor = isEmpty ? 'transparent' : light;
        style.borderColor = isEmpty ? normal : darkest;
      }
      if (this.UISize < 0) {
        style.paddingLeft = `${1 + this.UISize * 0.25}rem`;
        style.paddingRight = `${1 + this.UISize * 0.25}rem`;
      }
      return style;
    },

    toggleSquadDelete(): void {
      if (this.platoonId >= 0 && this.squadId >= 0) {
        this.$store.commit('setSquadMarkerDeletedState', { pID: this.platoonId, sID: this.squadId, toggle: true });
      }
    },

    toggleSquadArrival(): void {
      if (this.platoonId >= 0 && this.squadId >= 0) {
        this.$store.commit('setSquadMarkerArrowState', { pID: this.platoonId, sID: this.squadId, toggle: true });
      }
    },
  },
});
</script>
<style scoped>
</style>
