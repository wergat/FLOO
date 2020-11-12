const isElectron = typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer';

// TODO: Dont use electron.remote!
let electronWindow : any; // Electron.BrowserWindow;
if (isElectron) {
  electronWindow = window.require('electron').remote.getCurrentWindow();
}

const Interactable = {
  methods: {
    setWindowsFocus(isFocus: boolean) : void {
      this.$store.commit('setFocus', isFocus ? 1 : 0);
      if (!isElectron) { return; }
      if (isFocus) {
        electronWindow.setIgnoreMouseEvents(false);
      } else {
        electronWindow.setIgnoreMouseEvents(true, { forward: true });
      }
    },
  },
};

export default Interactable;
