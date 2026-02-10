// src/utils/sound.js
import { Platform } from 'react-native';
import Sound from 'react-native-nitro-sound';

let isSoundInit = false;

// Keep audio mixed with other apps and audible in silent switch (iOS)
export function initDing() {
  // react-native-nitro-sound doesn't require explicit initialization for basic playback
  // but we can set up any global configurations here if needed.
  isSoundInit = true;
}

// Replay from start even if still playing
export async function playDing() {
  if (!isSoundInit) initDing();
  try {
    // For bundled sounds, we might need platform specific paths
    // On Android, resources are usually in raw folder. 
    // On iOS, they are in the main bundle.
    const dingPath = Platform.OS === 'ios' ? 'ding.mp3' : 'ding';

    // stopPlayer returns a promise, ensuring we start fresh
    await Sound.stopPlayer();
    await Sound.startPlayer(dingPath);
  } catch (e) {
    console.warn('ding play error', e);
  }
}

// Optional: free memory (e.g., on logout)
export function releaseDing() {
  try {
    Sound.stopPlayer();
    isSoundInit = false;
  } catch (e) {
    console.warn('ding release error', e);
  }
}
