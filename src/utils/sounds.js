// src/utils/sound.js
import { Platform } from 'react-native';
import Sound from 'react-native-sound';

let ding = null;
let isLoaded = false;

// Keep audio mixed with other apps and audible in silent switch (iOS)
export function initDing() {
  // iOS categories: Ambient keeps other audio; Playback ignores silent switch
  if (Platform.OS === 'ios') {
    Sound.setCategory('Playback', true); // true = mixWithOthers
  } else {
    // Android categories: 'Ambient' avoids ducking other audio
    Sound.setCategory('Ambient', true);
  }

  ding = new Sound(
    // On Android use the "res/raw" name without extension; on iOS use file name in bundle
    Platform.OS === 'android' ? 'ding' : 'ding.mp3',
    Platform.OS === 'android' ? Sound.MAIN_BUNDLE : undefined,
    (err) => {
      if (err) {
        console.warn('ding load error', err);
        return;
      }
      isLoaded = true;
    }
  );
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
