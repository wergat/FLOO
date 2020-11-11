import { clamp } from '../unsorted/Utils';
import Color from 'color';

const PlatoonListEntry = {
  computed: {
    UISize() {
      return this.$store.getters.UISize;
    },
  },
  methods: {
    isDark(color: string): boolean {
      return Color(color).isDark();
    },

    getClassSize():string {
      const arr = ['small', 'normal', 'medium', 'large'];
      return `is-${arr[clamp(this.UISize, 0, 3)]}`;
    },

    getArrorStyle() : any {
      const size = this.UISize;
      return {
        padding: `${Math.max(size * 0.75, 0)}rem ${Math.max(size * 0.5, 0)}rem`,
        fontSize: `${Math.max(size * 0.5 + 1, 0)}rem`,
        marginRight: '4px',
      };
    },

    isNotBasic() : any {
      return this.UISize >= -1;
    },

    getPadding() : any {
      return {
        padding: `${1 + this.UISize * 0.5}rem`,
      };
    },

    getBottomMargin() : any {
      return {
        marginBottom: `${1.5 + this.UISize * 0.25}rem`,
      };
    },

    getNamePadding() : any {
      return {
        // .75rem 1rem
        padding: `${0.6 + this.UISize * 0.1}rem ${1 + this.UISize * 0.2}rem`,
      };
    },

    getNotificationPadding() : any {
      return {
        padding: `${Math.max(0.5 + this.UISize * 0.25, 0)}rem ${Math.max(0.5 + this.UISize * 0.25, 0.25)}rem 
              ${Math.max(this.UISize * 0.25, 0)}rem ${Math.max(0.75 + this.UISize * 0.5, 0)}rem`,
      };
    },
  },
};

export default PlatoonListEntry;
