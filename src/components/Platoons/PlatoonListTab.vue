<template>
  <b-tab-item
    label="Platoons"
    icon="users"
    :disabled="!this.enabled"
    :style="getPadding()"
  >
    <div class="container">
      <platoon-list-entry
        v-for="(platoon, index) of this.$store.getters.platoons"
        :key="index"
        :platoon-object="platoon"
        :platoon-id="platoon.id"
        :platoon-card-open="platoonCardOpen"
        @open-platoon-tab="platoonCardOpen = $event"
      />
      <b-collapse
        class="card"
        animation="slide"
        :open="false"
      >
        <div
          slot="trigger"
          class="card-header"
          role="button"
          @click="colorPickIsOpen = false"
        >
          <p
            :class="['card-header-title', 'platoonCardHeaderPlatoonName', 'content', getClassSize()]"
            :style="getNamePadding()"
          />
          <b-button
            type="is-success"
            :size="getClassSize()"
            :style="getAddPlatoonButtonStyle()"
            @click="addPlatoonToList"
          >
            <b-icon icon="plus" />
          </b-button>
          <a
            v-show="isNotBasic()"
            class="card-header-icon"
            :style="[getArrorStyle(),{visibility: 'hidden'}]"
          >
            <b-icon
              icon="plus"
            />
          </a>
        </div>
      </b-collapse>
    </div>
  </b-tab-item>
</template>

<script lang="ts">
import Vue from 'vue';
import PlatoonListEntry from './PlatoonListEntry.vue';
import ListEntryStyleFunctions from '../../mixins/platoonListEntryStyleFunctions';
import Camera from '../../map/Camera';

export default Vue.extend({
  name: 'PlatoonListTab',
  components: {
    PlatoonListEntry,
  },
  mixins: [ListEntryStyleFunctions],
  props: {
    enabled: Boolean,
  },
  data() {
    return {
      platoonCardOpen: -1,
    };
  },
  computed: {
    UISize() : number {
      return this.$store.getters.UISize;
    },
  },
  methods: {
    /**
     * Adds platoon to the list of platoons
     * Special name to try to fix a bug
     */
    addPlatoonToList() :void {
      const x = Camera.continentSize.x * (0.5 + (Math.random() / 10 - 0.05));
      const y = Camera.continentSize.y * (0.5 + (Math.random() / 10 - 0.05));
      this.$store.commit('addPlatoon', { x, y });
    },
    getPadding() : any {
      return {
        padding: `${0.5 + this.UISize * 0.25}rem`,
      };
    },
    getAddPlatoonButtonStyle() : any {
      // WHYYYYYYY
      const arr = [103, 135, 144, 195, 247, 298];
      return {
        margin: `${Math.max(0.1 + this.UISize * 0.1, 0)}rem`,
        // Width: 4 * Button Width + 6 * Margin
        width: `${arr[this.UISize + 2]}px`,
        color: 'white',
      };
    },
  },
});
</script>

<style>
.platoonCardHeaderPlatoonName {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0px!important;
}
</style>
