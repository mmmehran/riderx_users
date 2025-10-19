// src/utils/sound.js
import { Platform } from 'react-native';
import Sound from 'react-native-sound';

let ding = null;
let isLoaded = false;

// Keep audio mixed with other apps and audible in silent switch (iOS)
export function initDing() {
  if (Platform.OS === 'ios') {
    Sound.setCategory('Playback', true); // play even with mute switch; mix with others
    ding = new Sound('ding.mp3', Sound.MAIN_BUNDLE, (err) => {
      if (err) { console.warn('ding load error (iOS)', err); return; }
      isLoaded = true;
    });
  } else {
    Sound.setCategory('Ambient', true);
    ding = new Sound('ding', Sound.MAIN_BUNDLE, (err) => {
      if (err) { console.warn('ding load error (Android)', err); return; }
      isLoaded = true;
    });
  }
}

// Replay from start even if still playing
export function playDing() {
  if (!ding || !isLoaded) return;
  try {
    ding.stop(() => ding.play());
  } catch (e) {
    console.warn('ding play error', e);
  }
}

// Optional: free memory (e.g., on logout)
export function releaseDing() {
  if (ding) {
    ding.release();
    ding = null;
    isLoaded = false;
  }
}
