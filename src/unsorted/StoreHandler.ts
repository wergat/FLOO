import isElectron from 'is-electron';
import { Platoon } from '../assets/classes';

let Store : any;
if (isElectron()) {
  Store = window.require('electron-store');
}

/** Used to store the settings, like resolution, screen, warpgate, continent */
const settingsStore = isElectron() ? new Store({ name: 'config' }) : null;
/** Used to store data about each platoon in case of restart etc. */
const platoonStore = isElectron() ? new Store({ name: 'platoons' }) : null;
/** map markers */
const mapMarkerStore = isElectron() ? new Store({ name: 'mapMarkers' }) : null;

function getDefualtPlatoon(): Platoon[] {
  const list: Platoon[] = [];
  if (isElectron()) {
    let i = 0;
    let platData: Platoon;

    while (true) {
      platData = platoonStore.store[i];
      if (platData) {
        list.push(platData);
      } else { break; }
      i += 1;
    }
  } else {
    list.push({
      name: 'Something bad happened!',
      id: -1,
      squads: [
        {
          platoonID: 0,
          squadLetter: 'a',
          isInPosition: true,
          isEmpty: false,
          pos: {
            x: 10000,
            y: 10000,
          },
          marker: 0,
        },
        {
          platoonID: 1,
          squadLetter: 'b',
          isInPosition: true,
          isEmpty: false,
          pos: {
            x: 10000,
            y: 10000,
          },
          marker: 0,
        },
        {
          platoonID: 2,
          squadLetter: 'c',
          isInPosition: true,
          isEmpty: false,
          pos: {
            x: 10000,
            y: 10000,
          },
          marker: 0,
        },
        {
          platoonID: 3,
          squadLetter: 'd',
          isInPosition: true,
          isEmpty: false,
          pos: {
            x: 10000,
            y: 10000,
          },
          marker: 0,
        },
      ],
      lightestColor: 'hsl(222.29999999999995, 57.7%, 79.1%)',
      lightColor: 'hsl(222.29999999999995, 57.7%, 65.9%)',
      color: 'rgb(65, 106, 204)',
      darkColor: 'hsl(222.29999999999995, 57.7%, 39.6%)',
      darkestColor: 'hsl(222.29999999999995, 57.7%, 26.4%)',
    });
  }

  return list;
}

let lastData : Platoon[];
let recieveData : boolean = false;

function saveCachedData() {
  if (isElectron() && recieveData) {
    recieveData = false;
    platoonStore.store = lastData;
  }
}

// TODO: Save platoon data when not using electron
function savePlatoonData(platoonData : Platoon[]): void {
  recieveData = true;
  lastData = platoonData;
}

/** Returns the value of the stores setting */
function loadSetting(setting: string): any {
  if (isElectron()) {
    return settingsStore.get(setting);
  }
  return null;
}

/** Sets a setting to be saved */
function saveSettings(setting : string, value : any) {
  if (isElectron()) {
    settingsStore.set(setting, value);
  }
}

// Every minute, check if we need to update the data
window.setInterval(() => { saveCachedData(); }, 60000);

export {
  getDefualtPlatoon, savePlatoonData, saveCachedData, saveSettings, loadSetting,
};
