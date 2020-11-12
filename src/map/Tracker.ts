import isElectron from 'is-electron';
import electronCameraTracker from './ElectronCameraTracker';
import browserCameraTracker from './BrowserCameraTracker';

const tracker = isElectron() ? electronCameraTracker : browserCameraTracker;
tracker.start();

// TODO: Clean up a lot of duplicated code between the two trackers
export default {
  get() : any {
    return tracker;
  },
};
