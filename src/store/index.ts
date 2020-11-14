import Color from 'color';
import Vue from 'vue';
import Vuex from 'vuex';
import {
  getDefaultPlatoon, loadSetting, savePlatoonData, saveSettings, saveCachedData,
} from '../unsorted/StoreHandler';
import {
  Platoon, Squad, Coord, Continent,
} from '../assets/classes';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    platoons: getDefaultPlatoon(),
    continents: [
      {
        name: 'Indar',
        id: 0,
        mapBoxSize: { x: 23500, y: 23500 },
        UIColor: { primary: '#F5D77E', secondary: '#786137' },
        warpgates: [
          {
            name: 'Northern Warpgate', x: 12090, y: 3280, id: 0,
          },
          {
            name: 'Western Warpgate', x: 4010, y: 18280, id: 1,
          },
          {
            name: 'Eastern Warpgate', x: 18080, y: 19150, id: 2,
          },
        ],
      },
      {
        name: 'Amerish',
        id: 1,
        mapBoxSize: { x: 23500, y: 23500 },
        UIColor: { primary: '#C2F5D9', secondary: '#3C516B' },
        warpgates: [
          {
            name: '*Western Warpgate', x: 5410, y: 5850, id: 0,
          },
          {
            name: 'Eastern Warpgate', x: 19600, y: 5100, id: 1,
          },
          {
            name: '*Southern Warpgate', x: 6530, y: 18230, id: 2,
          },
        ],
      },
      {
        name: '*Esamir',
        id: 2,
        mapBoxSize: { x: 23500, y: 23500 },
        UIColor: { primary: '#C2F5D9', secondary: '#3C516B' },
        warpgates: [
          {
            name: 'North Western Warpgate', x: 5410, y: 5850, id: 0,
          },
          {
            name: 'Eastern Warpgate', x: 17840, y: 6280, id: 1,
          },
          {
            name: 'Southern Warpgate', x: 6530, y: 18230, id: 2,
          },
        ],
      },
      {
        name: 'Hossin',
        id: 3,
        mapBoxSize: { x: 23500, y: 23500 },
        UIColor: { primary: '#BBBBBB', secondary: '#444444' },
        warpgates: [
          {
            name: '*Western Warpgate', x: 0, y: 0, id: 0,
          },
          {
            name: 'Eastern Warpgate', x: 19800, y: 6150, id: 1,
          },
          {
            name: 'Southern Warpgate', x: 11570, y: 20460, id: 2,
          },
        ],
      },
    ],
    // -1 == Other, 0 == Game, 1 == UI
    // TODO: Improve detection by using package to detect wich program is currently focused
    focus: 0,
    UISize: loadSetting('UISize'),
    screenSize: { x: 1, y: 1 },
    showMapContent: true,
    isMovingUI: false,
    UIColor: 'hsl(221, 73%, 37%)',
  },
  getters: {
    isMovingUI: (state) : boolean => state.isMovingUI,
    showMapContent: (state) : boolean => state.showMapContent,
    isGameFocused: (state) : boolean => state.focus === 0,
    isUIFocused: (state) : boolean => state.focus === 1,
    UISize: (state) : number => state.UISize,
    platoons: (state) : Platoon[] => state.platoons,
    allSquads(state) : Squad[] {
      let squads : Squad[] = [];
      for (let i = 0; i < state.platoons.length; i++) {
        squads = squads.concat(state.platoons[i].squads);
      }
      return squads;
    },
    getPlatoonByIndex: (state) => (index: number) : Platoon => state.platoons[index],
    getPlatoonIndexByID: (state) => (id: number): number => state.platoons.map((platoon) => platoon.id).indexOf(id),
    getPlatoonIDByIndex: (state) => (index: number) : number => state.platoons[index].id,
    getPlatoonCount: (state) : number => state.platoons.length,
    getSquadByID: (state) => (pID: number, sID: number) : Squad => state.platoons[pID].squads[sID],
    continents: (state) : Continent[] => state.continents,
    getContinentByID: (state) => (id: number) : Continent => state.continents[id],
    UIColor: (state) : string => state.UIColor,
  },
  mutations: {
    addPlatoon(state, position: Coord): void {
      const platCounter = state.platoons.length;
      let hue = 0;
      let freedom = 60;
      let found = false;
      let compareHue = 0;
      let distance = 0;
      while (!found) {
        found = true;
        hue = Math.random() * 360;
        freedom -= 1;
        for (let i = 0; i < platCounter; i++) {
          compareHue = Color(state.platoons[i].color).hue();
          distance = Math.abs(((hue - compareHue + 180 + 360) % 360) - 180);
          if (distance < freedom) {
            found = false;
            break;
          }
        }
      }
      const ptColor = Color(`hsl(${hue},${50 + Math.random() * 15 * Math.random() * 15}%,${40 + Math.random() * 20 + Math.random() * 10}%)`);

      const pt = new Platoon();
      const spread = 200;
      const fix = spread / 2;
      pt.squads = [
        new Squad(pt.id, 0, { x: position.x + Math.random() * spread - fix, y: position.y + Math.random() * spread - fix }),
        new Squad(pt.id, 1, { x: position.x + Math.random() * spread - fix, y: position.y + Math.random() * spread - fix }),
        new Squad(pt.id, 2, { x: position.x + Math.random() * spread - fix, y: position.y + Math.random() * spread - fix }),
        new Squad(pt.id, 3, { x: position.x + Math.random() * spread - fix, y: position.y + Math.random() * spread - fix }),
      ];
      state.platoons.push(pt);
      state.platoons[platCounter].lightestColor = ptColor.lighten(0.5).toString();
      state.platoons[platCounter].lightColor = ptColor.lighten(0.25).toString();
      state.platoons[platCounter].color = ptColor.toString();
      state.platoons[platCounter].darkColor = ptColor.darken(0.25).toString();
      state.platoons[platCounter].darkestColor = ptColor.darken(0.5).toString();
      savePlatoonData(state.platoons);
      saveCachedData();
    },
    setPlatoonColor(state, payload: { pID: number, color: Color }): void {
      state.platoons[payload.pID].lightestColor = payload.color.lighten(0.5).toString();
      state.platoons[payload.pID].lightColor = payload.color.lighten(0.25).toString();
      state.platoons[payload.pID].color = payload.color.toString();
      state.platoons[payload.pID].darkColor = payload.color.darken(0.25).toString();
      state.platoons[payload.pID].darkestColor = payload.color.darken(0.5).toString();
    },
    /** Removes id by platoon id */
    removePlatoon(state, id: number): void {
      const i = state.platoons.map((platoon) => platoon.id).indexOf(id);
      state.platoons.splice(i, 1);
      savePlatoonData(state.platoons);
      saveCachedData();
    },
    /** Sets what is currently in focus, -1 == Other, 0 == Game, 1 == UI */
    setFocus(state, value: number): void {
      state.focus = value;
    },
    /** Sets the current UI Size, must be [-2,3] */
    setUISize(state, n: number): void {
      state.UISize = n;
      saveSettings('UISize', n);
    },
    /**
     * @param payload pID: platoon ID, sID: squadID, toggle : toggle this value? value: if toggle = false, set the state to this value
     */
    setSquadMarkerDeletedState(state, payload: { pID: number, sID: number, toggle?: boolean, value?: boolean }): void {
      const ID = state.platoons.map((platoon) => platoon.id).indexOf(payload.pID);
      if (payload.toggle) {
        state.platoons[ID].squads[payload.sID].isEmpty = !state.platoons[ID].squads[payload.sID].isEmpty;
      } else {
        state.platoons[ID].squads[payload.sID].isEmpty = !!payload.value;
      }
      savePlatoonData(state.platoons);
    },
    /**
     * @param payload pID: platoon ID, sID: squadID, toggle : toggle this value? value: if toggle = false, set the state to this value
     */
    setSquadMarkerArrowState(state, payload: { pID: number, sID: number, toggle?: boolean, value?: boolean }): void {
      const ID = state.platoons.map((platoon) => platoon.id).indexOf(payload.pID);
      if (payload.toggle) {
        state.platoons[ID].squads[payload.sID].isInPosition = !state.platoons[ID].squads[payload.sID].isInPosition;
      } else {
        state.platoons[ID].squads[payload.sID].isInPosition = !!payload.value;
      }
      savePlatoonData(state.platoons);
    },
    /**
     * Sets a squad to a specific position in mapspace
     * @param state Store
     * @param payload target xPos, yPos and squadID sID and platoonID pID to identify the squad
     */
    setSquadPosition(state, payload: { xPos: number, yPos: number, sID: number, pID: number }) : void {
      const ID = state.platoons.map((platoon) => platoon.id).indexOf(payload.pID);
      state.platoons[ID].squads[payload.sID].pos = { x: payload.xPos, y: payload.yPos };
      savePlatoonData(state.platoons);
    },
    /**
     * Clears current Continent Data, then writes payload onto it
     * TODO: Move all continent related stuff into its own handler
     * @param state Store
     * @param payload Continent Data
     */
    setContinentData(state, payload: any): void {
      while (state.continents.length > 0) {
        state.continents.pop();
      }
      payload.forEach((item: any) => { state.continents.push(item); });
    },
    setShowMapContent(state, value: boolean): void {
      state.showMapContent = value;
    },
    setMovingUI(state, value: boolean): void {
      state.isMovingUI = value;
    },
  },
  actions: {
  },
  modules: {
  },
});
