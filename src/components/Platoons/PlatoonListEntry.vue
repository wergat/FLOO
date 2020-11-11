<template>
  <b-collapse
    class="card"
    animation="slide"
    :open="platoonCardOpen == platoonId"
    @open="$emit('open-platoon-tab', platoonId)"
  >
    <!-- SQUAD CARD HEADER -->
    <div
      slot="trigger"
      slot-scope="props"
      class="card-header"
      role="button"
      @click="colorPickIsOpen = false"
    >
      <p
        :class="['card-header-title', 'platoonCardHeaderPlatoonName', 'content', getClassSize()]"
        :style="getNamePadding()"
      >
        {{ platoonObject.name }}
      </p>
      <platoon-list-squad-button
        v-for="(letter, squadIndex) in ['A', 'B', 'C', 'D']"
        :key="squadIndex"
        :platoon-id="platoonId"
        :squad-id="squadIndex"
        :letter="letter"
        :platoon-object="platoonObject"
      />
      <a
        v-show="isNotBasic()"
        class="card-header-icon"
        :style="getArrorStyle()"
      >
        <b-icon
          :icon="!props.open ? 'angle-down' : 'angle-up'"
        />
      </a>
    </div>
    <!-- SQUAD CARD CONTENT-->
    <div
      class="card-content"
      :style="getPadding()"
    >
      <div class="content">
        <b-field grouped>
          <b-input
            v-model="platoonObject.name"
            expanded
            :custom-class="getClassSize()"
            @blur="platoonNameChangeDone"
          />
          <div
            class="buttons"
            style="flex-shrink:0"
          >
            <b-button
              slot="trigger"
              :size="getClassSize()"
              icon-right="palette"
              :style="{backgroundColor: platoonObject.lightColor, borderColor: platoonObject.darkerColor,
                       color: isDark(platoonObject.color) ? 'white' : 'black'}"
              :aria-controls="'colorPickElement' + platoonId"
              @click="colorPickIsOpen = !colorPickIsOpen; loadColorPicker()"
            />
            <b-button
              type="is-danger"
              :size="getClassSize()"
              icon-right="trash-alt"
              @click="removePlatoon(platoonId);"
            >
              Delete
            </b-button>
          </div>
        </b-field>
        <b-collapse
          v-model="colorPickIsOpen"
          :aria-id="'colorPickElement' + platoonId"
          animation="slide"
        >
          <!-- TODO: Have the fields obey horizontal w/ full label and thin input size -->
          <div
            class="notification"
            :style="getNotificationPadding()"
          >
            <b-field
              :custom-class="getClassSize()"
              :style="getBottomMargin()"
            >
              <CustomSlider
                v-model="colorHue"
                :min="0"
                :max="359"
                :tooltip="false"
                :size="getClassSize()"
                :show-bar="false"
                expanded
                @input="updatePlatoonColor()"
              />
            </b-field>

            <b-field
              v-show="isNotBasic()"
              :custom-class="getClassSize()"
              :style="getBottomMargin()"
            >
              <CustomSlider
                v-model="colorSat"
                :tooltip="false"
                :min="50"
                :max="80"
                :size="getClassSize()"
                :show-bar="false"
                :slider-background="`linear-gradient(to right,hsl(${colorHue}, 50%, ${colorLig}%),hsl(${colorHue}, 80%, ${colorLig}%)`"
                @input="updatePlatoonColor()"
              />
            </b-field>

            <b-field
              v-show="isNotBasic()"
              :custom-class="getClassSize()"
              :style="getBottomMargin()"
            >
              <CustomSlider
                v-model="colorLig"
                :tooltip="false"
                :min="40"
                :max="70"
                :size="getClassSize()"
                :show-bar="false"
                :slider-background="`linear-gradient(to right,hsl(${colorHue}, ${colorSat}%, 40%),hsl(${colorHue}, ${colorSat}%, 70%)`"
                @input="updatePlatoonColor()"
              />
            </b-field>
          </div>
        </b-collapse>
      </div>
    </div>
  </b-collapse>
</template>

<script lang="ts">
import Vue from 'vue';
import Color from 'color';
import PlatoonListSquadButton from './PlatoonListSquadButton.vue';
import CustomSlider from './CustomSlider.vue';
import StyleFunctions from '../../mixins/platoonListEntryStyleFunctions';

// Test
export default Vue.extend({
  name: 'PlatoonListEntry',
  components: {
    PlatoonListSquadButton,
    CustomSlider,
  },
  mixins: [StyleFunctions],
  props: {
    platoonObject: { type: Object, default: undefined },
    platoonId: { type: Number, default: -1 },
    platoonCardOpen: { type: Number, default: -1 },
  },
  data() {
    return {
      name: 'hey',
      platoonNameChangeDone: true,
      colorPickIsOpen: false,
      colorHue: -1,
      colorSat: -1,
      colorLig: -1,
    };
  },
  created() {
    this.loadColorPicker();
  },
  methods: {
    /** Loads color into the platoon color picker from platoon data
     * Gets called when the color picker box gets opened
    */
    loadColorPicker(): void {
      const color = Color(this.platoonObject.color);
      this.colorHue = Math.round(color.hue());
      this.colorSat = Math.round(color.saturationl());
      this.colorLig = Math.round(color.lightness());
    },
    // TODO: Implement this.
    removePlatoon(id: number): void {
      this.$parent.platoonCardOpen = -1;
      this.$store.commit('removePlatoon', id);
    },

    updatePlatoonColor(): void {
      if (this.colorLig < 0 || this.colorSat < 0 || this.colorHue < 0) { return; }
      this.colorHue = (this.colorHue + 360) % 360;
      const color = Color(
        `hsl(${this.colorHue},${this.colorSat}%,${this.colorLig}%)`,
      );
      this.platoonObject.lightestColor = color.lighten(0.5).toString();
      this.platoonObject.lightColor = color.lighten(0.25).toString();
      this.platoonObject.color = color.toString();
      this.platoonObject.darkColor = color.darken(0.25).toString();
      this.platoonObject.darkestColor = color.darken(0.5).toString();
      // setPlatoonColor(platoonData, color);
      // updatePlatoonColor(platoonID);
    },
  },
});
</script>
<style scoped>
.tooltip-content {
  z-index: 25;
}
</style>
