// googleMapsNavigator.js
import { Linking, Platform } from 'react-native';

const to6 = n => Number(n).toFixed(6);

export async function openGoogleMaps({ lat, lng, label = 'Destination', mode = 'd' }) {
  const latStr = to6(lat);
  const lngStr = to6(lng);
  const encodedLabel = encodeURIComponent(label);

  // driving (d), walking (w), bicycling (b), transit (t)
  const gmModeWeb =
    mode === 'w' ? 'walking' : mode === 'b' ? 'bicycling' : mode === 't' ? 'transit' : 'driving';

  // App URLs
  const iosApp = `comgooglemaps://?daddr=${latStr},${lngStr}&directionsmode=${gmModeWeb}`;
  const androidApp = `google.navigation:q=${latStr},${lngStr}&mode=${mode}`;

  // Web fallback
  const web = `https://www.google.com/maps/dir/?api=1&destination=${latStr},${lngStr}&destination_place_id=&travelmode=${gmModeWeb}`;

  try {
    if (Platform.OS === 'ios') {
      const can = await Linking.canOpenURL('comgooglemaps://');
      return Linking.openURL(can ? iosApp : web);
    } else {
      // on Android, google.navigation: works if Maps is installed
      const can = await Linking.canOpenURL('google.navigation:');
      return Linking.openURL(can ? androidApp : web);
    }
  } catch {
    return Linking.openURL(web);
  }
}
