// src/utils/externalMap.js
import { Linking, Platform } from 'react-native';

const buildExternalMapUrl = ({ appCode, lat, lng, label }) => {
  const coords = `${lat},${lng}`;
  const q = encodeURIComponent(label || '');

  let code = appCode;
  // Apple Maps is iOS-only → on Android, fall back to Google
  if (Platform.OS === 'android' && code === 'apple') {
    code = 'google';
  }

  switch (code) {
    case 'google':
      return Platform.select({
        ios: `comgooglemaps://?q=${q}&center=${coords}&zoom=16`,
        android: `google.navigation:q=${coords}`,
      });

    case 'waze':
      return `waze://?ll=${coords}&navigate=yes`;

    case 'wego':
      return `wego://route?point=${coords}&mode=drive`;

    case 'yandex':
      // Yandex Maps (ru.yandex.yandexmaps)
      // NOTE: ll = LON,LAT
      return `yandexmaps://maps.yandex.ru/?ll=${lng},${lat}&z=16`;

    case 'gis':
      // 2GIS (lon,lat)
      return `dgis://2gis.ru/geo/${lng},${lat}`;

    case 'apple':
      // Apple Maps (iOS)
      return `http://maps.apple.com/?ll=${coords}&q=${q}`;

    default:
      // fallback web Google Maps
      return `https://www.google.com/maps/search/?api=1&query=${coords}`;
  }
};

export const openExternalMap = async (appCode, lat, lng, label) => {
  const primaryUrl = buildExternalMapUrl({ appCode, lat, lng, label });

  try {
    const canOpenPrimary = await Linking.canOpenURL(primaryUrl);
    console.log('openExternalMap', appCode, primaryUrl, canOpenPrimary);

    if (canOpenPrimary) {
      await Linking.openURL(primaryUrl);
      return;
    }

    // optional: Waze extra web fallback
    if (appCode === 'waze') {
      const wazeWeb = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
      if (await Linking.canOpenURL(wazeWeb)) {
        await Linking.openURL(wazeWeb);
        return;
      }
    }

    // Google web fallback
    const googleWeb = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    if (await Linking.canOpenURL(googleWeb)) {
      await Linking.openURL(googleWeb);
      return;
    }

    // final fallback
    const fallback = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    await Linking.openURL(fallback);
  } catch (e) {
    console.log('openExternalMap error', e);
  }
};

/**
 * Internal probe list used just to detect installed apps.
 * (No icons here, only schemes.)
 */
const MAP_APP_PROBES = [
  {
    code: 'google',
    // use deep link format that matches your openExternalMap
    testUrl:
      Platform.select({
        ios: 'comgooglemaps://',
        android: 'google.navigation:q=0,0',
      }) || null,
  },
  {
    code: 'waze',
    testUrl: 'waze://?ll=0,0&navigate=yes',
  },
  {
    code: 'wego',
    testUrl: 'wego://route?point=0,0&mode=drive',
  },
  {
    code: 'yandex',
    testUrl: 'yandexmaps://maps.yandex.ru/?ll=0,0&z=10',
  },
  {
    code: 'gis',
    testUrl: 'dgis://2gis.ru/geo/0,0',
  },
  {
    code: 'apple',
    testUrl: Platform.OS === 'ios' ? 'maps://?daddr=0,0' : null,
  },
];

/**
 * Returns array of codes of map apps that are installed.
 * Example: ['google', 'waze', 'yandex']
 */
export const getAvailableMapApps = async () => {
  const checks = MAP_APP_PROBES.map(async app => {
    if (!app.testUrl) return null;

    try {
      const ok = await Linking.canOpenURL(app.testUrl);
      return ok ? app.code : null;
    } catch (e) {
      console.log('canOpenURL error for', app.code, e);
      return null;
    }
  });

  const results = await Promise.all(checks);
  return results.filter(Boolean); // remove nulls
};
