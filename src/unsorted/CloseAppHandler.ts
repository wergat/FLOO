import isElectron from 'is-electron';

/**
 * getResolution resurns the resolution of the current screen
 * Gets the current resolution from the ipc renderer if electron exits, otherwise returns window width/height
 */
function closeApp(): void {
  if (isElectron()) {
    const { ipcRenderer } = window.require('electron');
    // TODO: Check if its needed to change this to async
    ipcRenderer.send('close-app');
  } else {
    window.close();
  }
}

export default closeApp;
