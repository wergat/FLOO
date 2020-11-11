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

/**
 * Returns the saved platoon data as a list.
 * Returns empty list if it could not find any data
 */
function getDefaultPlatoon(): Platoon[] {
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
  }
  return list;
}

let lastData : Platoon[];
let recieveData : boolean = false;

/**
 * Saves the currently chached platoon data to disk
 * gets called every minute, or when a platoon is created/deleted, and when the app is quit
 */
function saveCachedData(): void {
  if (isElectron() && recieveData) {
    recieveData = false;
    platoonStore.store = lastData;
  }
}

// TODO: Save platoon data when not using electron
/**
 * Chaches the given platoon data
 * It gets written to disk every minute, to reduce disk usage.
 * @param platoonData Platoon List to write to disk
 */
function savePlatoonData(platoonData : Platoon[]): void {
  recieveData = true;
  lastData = platoonData;
}

/**
 * Returns the value of the stores setting
 * Returns value of settings, or null if it could not load it
 */
function loadSetting(setting: string): any {
  if (!isElectron()) { return null; }
  return settingsStore.get(setting);
}

/**
 * Sets a setting to be saved
 */
function saveSettings(setting : string, value : any): void {
  if (isElectron()) {
    settingsStore.set(setting, value);
  }
}

// Every minute, check if we need to update the data
window.setInterval(() => { saveCachedData(); }, 60000);

export {
  getDefaultPlatoon, savePlatoonData, saveCachedData, saveSettings, loadSetting,
};
