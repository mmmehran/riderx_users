// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'react-native-localize';
import { I18nManager } from 'react-native';
// Optional (only if you install it): import RNRestart from 'react-native-restart';

import en from '../enums/en.json';
import de from '../enums/de.json';
import ar from '../enums/ar.json';

const SUPPORTED = ['en', 'de', 'ar'];

function pickDeviceLang() {
  const locales = getLocales?.() || [];
  const code = locales[0]?.languageCode?.toLowerCase();
  return SUPPORTED.includes(code) ? code : 'en';
}

const resources = {
  en: { translation: en },
  de: { translation: de },
  ar: { translation: ar },
};

// init immediately with a safe default so UI can render
i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  compatibilityJSON: 'v3',
  interpolation: { escapeValue: false },
});

/**
 * Initialize language from AsyncStorage or device.
 * Also toggles RTL for Arabic.
 */
export async function initLanguage() {
  try {
    const stored = await AsyncStorage.getItem('language');
    const next = stored || pickDeviceLang();
    await applyLanguage(next, { reloadIfDirectionChanged: false });
  } catch {
    const next = pickDeviceLang();
    await applyLanguage(next, { reloadIfDirectionChanged: false });
  }
}

/**
 * Change language at runtime and persist it.
 * If direction changes (LTR ↔ RTL), we toggle I18nManager and (optionally) restart.
 */
export async function applyLanguage(lang, opts = { reloadIfDirectionChanged: true }) {
  const wantRTL = lang === 'ar';
  const isRTL = I18nManager.isRTL;

  await AsyncStorage.setItem('language', lang);
  await i18n.changeLanguage(lang);

//   if (wantRTL !== isRTL) {
//     // Toggle RTL/LTR
//     I18nManager.allowRTL(wantRTL);
//     I18nManager.forceRTL(wantRTL);

//     // If you have react-native-restart, uncomment to force app reload:
//     // if (opts.reloadIfDirectionChanged) RNRestart.restart();
//     // Otherwise, ask the user to manually reload or re-mount the root.
//   }
}

export default i18n;
