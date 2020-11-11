<template>
  <b-tab-item
    label="Settings"
    icon="wrench"
    :style="getPadding()"
  >
    <div class="container">
      <b-progress
        :value="getSettingsProgress"
        :max="3"
        :type="isSettingsDone ? 'is-success' : 'is-warning'"
        :style="progressStyle()"
        :size="getClassSize"
      />
      <!-- SCREEN RESOLUTION -->
      <b-field :type="isResolutionOkay ? 'is-success' : 'is-danger'">
        <b-select
          v-model="selectedParentResolution"
          icon="desktop"
          expanded
          :size="getClassSize"
        >
          <option
            v-for="resolution in getSupportedParentResolutions"
            :key="'preso' + resolution.id"
            :value="resolution.name"
          >
            {{ resolution.name }}
          </option>
        </b-select>
        <b-select
          v-model="selectedResolutionID"
          icon="desktop"
          expanded
          :disabled="selectedParentResolution.length === 0"
          :size="getClassSize"
        >
          <option
            v-for="resolution in getSupportedResolutions"
            :key="'reso' + resolution.id"
            :value="resolution.id"
          >
            {{ resolution.name }}
          </option>
        </b-select>
        <p class="control">
          <b-button
            type="is-warning"
            :size="getClassSize"
            @click="autoDetectResolution()"
          >
            Auto
          </b-button>
        </p>
      </b-field>
      <!-- CONTINENT -->
      <b-field :type="isWarpgateAndContinentOkay ? 'is-success' : 'is-danger'">
        <!-- TODO: placeholder="Continent" not working, workaround: ??? make color on a per-field basis? -->
        <b-select
          v-model="continentSelectedID"
          icon="globe"
          expanded
          :size="getClassSize"
        >
          <option
            v-for="continent in this.$store.getters.continents"
            :key="'cont' + continent.id"
            :value="continent.id"
          >
            {{ continent.name }}
          </option>
        </b-select>
        <!-- TODO: placeholder="[Anything]" not working, workaround: ??? make color on a per-field basis?-->
        <b-select
          v-model="warpgateSelectedID"
          placeholder="'Select a Warpgate'"
          :disabled="continentSelectedID < 0"
          expanded
          :size="getClassSize"
        >
          <option
            v-for="warpgate in getWarpgates"
            :key="'wg' + warpgate.id"
            :value="warpgate.id"
          >
            {{ warpgate.name }}
          </option>
        </b-select>
      </b-field>
      <!-- FACTION -->
      <b-field>
        <b-radio-button
          v-model="factionSelect"
          native-value="VS"
          expanded
          :size="getClassSize"
        >
          VS
        </b-radio-button>
        <b-radio-button
          v-model="factionSelect"
          native-value="TR"
          expanded
          :size="getClassSize"
        >
          TR
        </b-radio-button>
        <b-radio-button
          v-model="factionSelect"
          native-value="NC"
          expanded
          :size="getClassSize"
        >
          NC
        </b-radio-button>
      </b-field>
      <!-- UI SIZE/ZOOM -->
      <b-field grouped>
        <b-button
          v-show="UISize > -2"
          :size="getClassSize"
          icon-right="search-minus"
          @click="UISize = UISize - 1"
        />
        <b-slider
          v-model="UISize"
          :min="-2"
          :max="3"
          ticks
          lazy
          :size="getClassSize"
          :custom-formatter="val => (['basic','tiny','small','normal','medium','large'])[val + 2]"
          :style="UIScaleSliderStyle()"
        >
          <b-slider-tick
            v-for="i in [-1,3]"
            :key="'s' + i"
            :value="i"
          />
        </b-slider>
        <b-button
          v-show="UISize > -2"
          :size="getClassSize"
          icon-right="search-plus"
          :disabled="UISize == 3"
          @click="UISize = UISize + 1"
        />
      </b-field>
      <!-- Bottom Buttons -->
      <b-field
        position="is-centered"
        grouped
      >
        <b-button
          class="button is-danger"
          icon-left="times"
          :size="getClassSize"
          @click="closeApp"
        >
          Exit
        </b-button>
        <b-button
          :size="getClassSize"
          expanded
          :style="{visibility: 'hidden'}"
        />
        <b-tooltip label="Move Window">
          <b-button
            :type="isMovingUI ? '' : 'is-primary'"
            :size="getClassSize"
            icon-right="arrows-alt"
            @click="toggleMoveUI"
          />
        </b-tooltip>
        <b-tooltip
          :label="showMapContent ? 'Hide map contents' : 'Hiding map contents'"
          :type="showMapContent ? 'is-primary' : 'is-danger'"
          :always="!showMapContent"
        >
          <b-button
            :type="showMapContent ? 'is-primary' : 'is-danger'"
            :size="getClassSize"
            :icon-right="showMapContent ? 'eye' : 'eye-slash'"
            @click="toggleMinimize"
          />
        </b-tooltip>

        <b-button
          class="button is-success"
          :size="getClassSize"
          icon-right="save"
          :disabled="!isSettingsDone"
          @click="saveSettings"
        >
          Save
        </b-button>
      </b-field>
    </div>
  </b-tab-item>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapGetters } from 'vuex';

import { clamp } from '../../unsorted/Utils';
import { saveCachedData } from '../../unsorted/StoreHandler';
import Camera from '../../map/Camera';
import CloseApp from '../../unsorted/CloseAppHandler';
import {
  getClosestResolutionID, getResolution, getResolutionByID, getResolutionCount,
} from '../../unsorted/ResolutionHandler';
import { Coord } from '../../assets/classes';

export default Vue.extend({
  name: 'SettingsTab',
  components: {},
  data() {
    return {
      continentSelectedID: -1,
      warpgateSelectedID: -1,
      selectedParentResolution: '',
      selectedResolutionID: -1,
      autoResolutionTarget: '',
      factionSelect: '',
    };
  },
  computed: {
    ...mapGetters(['showMapContent']),
    UISize: {
      get(): number {
        return this.$store.getters.UISize;
      },
      set(newValue: number): void {
        this.$store.commit('setUISize', newValue);
      },
    },
    isMovingUI(): boolean {
      return this.$store.getters.isMovingUI;
    },
    isSettingsDone() : boolean {
      return this.isResolutionOkay;
    },
    getClassSize(): string {
      const arr = ['small', 'normal', 'medium', 'large'];
      return `is-${arr[clamp(this.UISize, 0, 3)]}`;
    },

    isWarpgateAndContinentOkay(): boolean {
      return this.continentSelectedID >= 0 && this.warpgateSelectedID >= 0;
    },

    isResolutionOkay(): boolean {
      if (this.selectedResolutionID < 0) {
        return false;
      }
      return (
        this.coordToReso(getResolutionByID(this.selectedResolutionID).parent) === this.selectedParentResolution
      );
    },

    getSettingsProgress(): number {
      let perc = 0;
      if (this.isResolutionOkay) {
        perc += 1;
      }
      if (this.isWarpgateAndContinentOkay) {
        perc += 1;
      }
      if (this.factionSelect !== '') {
        perc += 1;
      }
      return perc;
    },

    getWarpgates(): any {
      if (this.continentSelectedID >= 0) {
        return this.$store.getters.getContinentByID(this.continentSelectedID).warpgates;
      }
      return [{ id: 0, name: 'no warpgate data found' }];
    },

    getSupportedParentResolutions(): any {
      const list: {name: string, id: number}[] = [];
      for (let i = 0; i < getResolutionCount(); i++) {
        if (list.indexOf(this.coordToReso(getResolutionByID(i).parent)) === -1) {
          list.push({
            name: this.coordToReso(getResolutionByID(i).parent),
            id: i,
          });
        }
      }
      return list;
    },

    getSupportedResolutions(): any {
      const list = [];
      if (getResolutionByID(0).parent) {
        for (let i = 0; i < getResolutionCount(); i++) {
          if (this.coordToReso(getResolutionByID(i).parent) === this.selectedParentResolution) {
            list.push({
              name: this.coordToReso(getResolutionByID(i).resolution),
              id: getResolutionByID(i).id,
            });
          }
        }
      }
      if (list.length === 0) {
        return [{ name: '', id: -1 }];
      }
      return list;
    },
  },
  watch: {
    isSettingsDone(newV : boolean): void {
      this.$emit('settingsDone', newV);
    },
  },
  mounted() {
    this.autoDetectResolution();
  },
  methods: {
    coordToReso(coord : Coord): string {
      return `${coord.x}x${coord.y}`;
    },

    getPadding(): { padding: string } {
      return {
        padding: `${0.5 + this.UISize * 0.25}rem`,
      };
    },

    progressStyle(): { marginBottom: string; height: string } {
      return {
        marginBottom: `${0.75 + this.UISize * 0.25}rem`,
        height: `${Math.max(0.75 + this.UISize * 0.25, 0)}rem`,
      };
    },

    UIScaleSliderStyle(): { padding: string; margin: string } {
      return {
        padding: `0rem ${1.5 + this.UISize * 0.25}rem`,
        margin: `${Math.max(0.5 + this.UISize * 0.25, 0)}rem 0rem`,
      };
    },

    toggleMinimize(): void {
      this.$store.commit('setShowMapContent', !this.showMapContent);
    },

    toggleMoveUI(): void {
      this.$store.commit('setMovingUI', !this.isMovingUI);
    },

    saveSettings(): void {
      saveCachedData();
    },

    closeApp():void {
      saveCachedData();
      CloseApp();
    },

    autoDetectResolution(): void {
      const reso = getResolutionByID(getClosestResolutionID(getResolution()));
      this.selectedParentResolution = this.coordToReso(reso.parent);
      this.selectedResolutionID = reso.id;
      Camera.loadResolution(reso);
      Camera.clampCameraPosition();
    },
  },
});
</script>

<style>
</style>
