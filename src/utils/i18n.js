// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'react-native-localize';
import { I18nManager } from 'react-native';
// Optional: import RNRestart from 'react-native-restart';

import en from '../enums/en.json';
import de from '../enums/de.json';
import ar from '../enums/ar.json';
import tr from '../enums/tr.json'; 
import fa from '../enums/fa.json';

const SUPPORTED = ['en', 'de', 'ar', 'tr', 'fa']; 

// Map regioned locale codes to your canonical ones
const CANONICAL = {
  en: 'en', 'en-US': 'en', 'en-GB': 'en',
  de: 'de', 'de-DE': 'de',
  ar: 'ar', 'ar-SA': 'ar', 'ar-AE': 'ar',
  tr: 'tr', 'tr-TR': 'tr',                 
  fa: 'fa', 'fa-IR': 'fa', 'fa-AF': 'fa',  
};

function canonicalize(code) {
  if (!code) return 'en';
  const lc = code.toLowerCase();
  return CANONICAL[lc] || CANONICAL[lc.split('-')[0]] || 'en';
}

function pickDeviceLang() {
  const locales = getLocales?.() || [];
  const code = locales[0]?.languageTag || locales[0]?.languageCode; // e.g., "fa-IR"
  const canon = canonicalize(code);
  return SUPPORTED.includes(canon) ? canon : 'en';
}

const resources = {
  en: { translation: en },
  de: { translation: de },
  ar: { translation: ar },
  tr: { translation: tr }, 
  fa: { translation: fa },
};

// init with safe default
i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  compatibilityJSON: 'v3',
  interpolation: { escapeValue: false },
});

/**
 * Initialize language from AsyncStorage or device.
 * Also toggles RTL for Arabic & Persian.
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
 * If direction changes (LTR ↔ RTL), toggle I18nManager and (optionally) restart.
 */
export async function applyLanguage(lang, opts = { reloadIfDirectionChanged: true }) {
  const canon = canonicalize(lang);
  const wantRTL = canon === 'ar' || canon === 'fa'; // ⬅️ Arabic & Persian are RTL
  const isRTL = I18nManager.isRTL;

  await AsyncStorage.setItem('language', canon);
  await i18n.changeLanguage(canon);

  // If you want auto layout direction switching, uncomment this block:
  // if (wantRTL !== isRTL) {
  //   I18nManager.allowRTL(wantRTL);
  //   I18nManager.forceRTL(wantRTL);
  //   // If you have react-native-restart:
  //   // if (opts.reloadIfDirectionChanged) RNRestart.restart();
  //   // Else, ask user to reload or re-mount the app root.
  // }
}

export default i18n;
