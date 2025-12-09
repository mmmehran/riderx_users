import { Linking, Platform } from 'react-native';

const buildExternalMapUrl = ({ appCode, lat, lng, label }) => {
  const coords = `${lat},${lng}`;
  const q = encodeURIComponent(label || '');

  let code = appCode;
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
      // ✅ Yandex Maps (ru.yandex.yandexmaps)
      // NOTE: ll = LON,LAT
      return `yandexmaps://maps.yandex.ru/?ll=${lng},${lat}&z=16`;

    case 'gis':
      return `dgis://2gis.ru/geo/${lng},${lat}`;

    case 'apple':
      return `http://maps.apple.com/?ll=${coords}&q=${q}`;

    default:
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
