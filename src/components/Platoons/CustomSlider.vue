<template>
  <div
    class="b-slider"
    :class="[size, type, rootClasses ]"
    @click="onSliderClick"
  >
    <div
      ref="slider"
      class="b-slider-track"
      :style="sliderBackgroundStyle"
    >
      <div
        :class="{'b-slider-fill' : showBar}"
        :style="barStyle"
      />
      <template v-if="ticks">
        <b-slider-tick
          v-for="(val, key) in tickValues"
          :key="key"
          :value="val"
        />
      </template>
      <slot />
      <b-slider-thumb
        ref="button1"
        v-model="value1"
        :tooltip-always="tooltipAlways"
        :type="newTooltipType"
        :tooltip="tooltip"
        :custom-formatter="customFormatter"
        :indicator="indicator"
        :format="format"
        :locale="locale"
        role="slider"
        :aria-valuenow="value1"
        :aria-valuemin="min"
        :aria-valuemax="max"
        aria-orientation="horizontal"
        :aria-label="Array.isArray(ariaLabel) ? ariaLabel[0] : ariaLabel"
        :aria-disabled="disabled"
        @dragstart="onDragStart"
        @dragend="onDragEnd"
      />
      <b-slider-thumb
        v-if="isRange"
        ref="button2"
        v-model="value2"
        :tooltip-always="tooltipAlways"
        :type="newTooltipType"
        :tooltip="tooltip"
        :custom-formatter="customFormatter"
        :indicator="indicator"
        :format="format"
        :locale="locale"
        role="slider"
        :aria-valuenow="value2"
        :aria-valuemin="min"
        :aria-valuemax="max"
        aria-orientation="horizontal"
        :aria-label="Array.isArray(ariaLabel) ? ariaLabel[1] : ''"
        :aria-disabled="disabled"
        @dragstart="onDragStart"
        @dragend="onDragEnd"
      />
    </div>
  </div>
</template>

<script>
import SliderThumb from 'buefy/src/components/slider/SliderThumb.vue';
import SliderTick from 'buefy/src/components/slider/SliderTick.vue';
import config from 'buefy/src/utils/config';
import { bound } from 'buefy/src/utils/helpers';
/*eslint-disable */
export default {
  name: 'CustomSlider',
  components: {
    [SliderThumb.name]: SliderThumb,
    [SliderTick.name]: SliderTick,
  },
  props: {
    value: {
      type: [Number, Array],
      default: 0,
    },
    min: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    step: {
      type: Number,
      default: 1,
    },
    type: {
      type: String,
      default: 'is-primary',
    },
    size: String,
    ticks: {
      type: Boolean,
      default: false,
    },
    tooltip: {
      type: Boolean,
      default: true,
    },
    tooltipType: String,
    rounded: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    lazy: {
      type: Boolean,
      default: false,
    },
    showBar : {
        type: Boolean,
        default: true,
    },
    sliderBackground: {
        type: String,
        default: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
    },
    customFormatter: Function,
    ariaLabel: [String, Array],
    biggerSliderFocus: {
      type: Boolean,
      default: false,
    },
    indicator: {
      type: Boolean,
      default: false,
    },
    format: {
      type: String,
      default: 'raw',
      validator: (value) => [
        'raw',
        'percent',
      ].indexOf(value) >= 0,
    },
    locale: {
      type: [String, Array],
      default: () => config.defaultLocale,
    },
    tooltipAlways: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      value1: null,
      value2: null,
      dragging: false,
      isRange: false,
      _isSlider: true, // Used by Thumb and Tick
    };
  },
  computed: {
    newTooltipType() {
      return this.tooltipType ? this.tooltipType : this.type;
    },
    tickValues() {
      if (!this.ticks || this.min > this.max || this.step === 0) return [];
      const result = [];
      for (let i = this.min + this.step; i < this.max; i += this.step) {
        result.push(i);
      }
      return result;
    },
    minValue() {
      return Math.min(this.value1, this.value2);
    },
    maxValue() {
      return Math.max(this.value1, this.value2);
    },
    barSize() {
      return this.isRange
        ? `${100 * (this.maxValue - this.minValue) / (this.max - this.min)}%`
        : `${100 * (this.value1 - this.min) / (this.max - this.min)}%`;
    },
    barStart() {
      return this.isRange
        ? `${100 * (this.minValue - this.min) / (this.max - this.min)}%`
        : '0%';
    },
    precision() {
      const precisions = [this.min, this.max, this.step].map((item) => {
        const decimal = (`${item}`).split('.')[1];
        return decimal ? decimal.length : 0;
      });
      return Math.max(...precisions);
    },
    sliderBackgroundStyle() {
      return {
          background: this.sliderBackground,
      };
    },
    barStyle() {
      return {
        width: this.barSize,
        left: this.barStart,
      };
    },
    rootClasses() {
      return {
        'is-rounded': this.rounded,
        'is-dragging': this.dragging,
        'is-disabled': this.disabled,
        'slider-focus': this.biggerSliderFocus,
      };
    },
  },
  watch: {
    /**
        * When v-model is changed set the new active step.
        */
    value(value) {
      this.setValues(value);
    },
    value1() {
      this.onInternalValueUpdate();
    },
    value2() {
      this.onInternalValueUpdate();
    },
    min() {
      this.setValues(this.value);
    },
    max() {
      this.setValues(this.value);
    },
  },
  created() {
    this.isThumbReversed = false;
    this.isTrackClickDisabled = false;
    this.setValues(this.value);
  },
  methods: {
    setValues(newValue) {
      if (this.min > this.max) {
        return;
      }
      if (Array.isArray(newValue)) {
        this.isRange = true;
        const smallValue = typeof newValue[0] !== 'number' || isNaN(newValue[0])
          ? this.min
          : bound(newValue[0], this.min, this.max);
        const largeValue = typeof newValue[1] !== 'number' || isNaN(newValue[1])
          ? this.max
          : bound(newValue[1], this.min, this.max);
        this.value1 = this.isThumbReversed ? largeValue : smallValue;
        this.value2 = this.isThumbReversed ? smallValue : largeValue;
      } else {
        this.isRange = false;
        this.value1 = isNaN(newValue)
          ? this.min
          : bound(newValue, this.min, this.max);
        this.value2 = null;
      }
    },
    onInternalValueUpdate() {
      if (this.isRange) {
        this.isThumbReversed = this.value1 > this.value2;
      }
      if (!this.lazy || !this.dragging) {
        this.emitValue('input');
      }
      if (this.dragging) {
        this.emitValue('dragging');
      }
    },
    sliderSize() {
      return this.$refs.slider.getBoundingClientRect().width;
    },
    onSliderClick(event) {
      if (this.disabled || this.isTrackClickDisabled) return;
      const sliderOffsetLeft = this.$refs.slider.getBoundingClientRect().left;
      const percent = (event.clientX - sliderOffsetLeft) / this.sliderSize() * 100;
      const targetValue = this.min + percent * (this.max - this.min) / 100;
      const diffFirst = Math.abs(targetValue - this.value1);
      if (!this.isRange) {
        if (diffFirst < this.step / 2) return;
        this.$refs.button1.setPosition(percent);
      } else {
        const diffSecond = Math.abs(targetValue - this.value2);
        if (diffFirst <= diffSecond) {
          if (diffFirst < this.step / 2) return;
          this.$refs.button1.setPosition(percent);
        } else {
          if (diffSecond < this.step / 2) return;
          this.$refs.button2.setPosition(percent);
        }
      }
      this.emitValue('change');
    },
    onDragStart() {
      this.dragging = true;
      this.$emit('dragstart');
    },
    onDragEnd() {
      this.isTrackClickDisabled = true;
      setTimeout(() => {
        // avoid triggering onSliderClick after dragend
        this.isTrackClickDisabled = false;
      }, 0);
      this.dragging = false;
      this.$emit('dragend');
      if (this.lazy) {
        this.emitValue('input');
      }
    },
    emitValue(type) {
      this.$emit(type, this.isRange
        ? [this.minValue, this.maxValue]
        : this.value1);
    },
  },
};
/* eslint-enable */
</script>
