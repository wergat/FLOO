<template>
  <div id="app">
    <left-box />
    <map-contents v-if="showMapContent" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';

import LeftBox from './components/Core/LeftBox.vue';
import MapContents from './components/Core/MapContent.vue';

export default Vue.extend({
  name: 'App',
  components: {
    MapContents,
    LeftBox,
  },
  computed: { ...mapGetters(['showMapContent']) },
});

</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

html {
  background-color: transparent !important;
  overflow: hidden !important;
  user-select: none;
}
</style>
