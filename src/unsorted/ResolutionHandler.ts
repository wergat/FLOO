import isElectron from 'is-electron';
import { Coord, ResolutionSettings } from '../assets/classes';
import resolutionData from './resolutionData.json';

let ipcRenderer : any;
if (isElectron()) {
  ipcRenderer = window.require('electron').ipcRenderer;
}

/**
 * getResolution resurns the resolution of the current screen
 * Gets the current resolution from the ipc renderer if electron exits, otherwise returns window width/height
 */
function getResolution() : Coord {
  if (isElectron()) {
    // TODO: Check if its needed to change this to async
    return ipcRenderer.sendSync('get-resolution');
  }
  return { x: window.innerWidth, y: window.innerHeight };
}

/** Returns the id of the matching detected resolution if its exists, or the closest one if not */
function getClosestResolutionID(size: Coord): number {
  const { x } = size;
  const { y } = size;
  if (resolutionData.length === 0) { return -1; }
  let i = 0;
  let range = 0;

  while (true) {
    for (i = 0; i < resolutionData.length; i++) {
      if (Math.abs(resolutionData[i].detected.x - x) <= range && Math.abs(resolutionData[i].detected.y - y) <= range) {
        return i;
      }
    }
    range += 10;
  }
}

function getResolutionByID(id : number) : ResolutionSettings {
  return resolutionData[id];
}

function getResolutionCount() : number {
  return resolutionData.length;
}

// TODO: Have a way to hook into and detect if resolution changed
export {
  getResolution, getClosestResolutionID, getResolutionByID, getResolutionCount,
};
