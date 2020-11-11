const UIColor = {
  computed: {
    UIColor() : string {
      return this.$store.getters.UIColor;
    },
    UIColorBGStyle() : {backgroundColor:string, borderColor: string} {
      return { backgroundColor: this.UIColor, borderColor: this.UIColor };
    },
  },
};

export default UIColor;
