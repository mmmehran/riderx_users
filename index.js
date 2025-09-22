/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import notifee, { EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_ACCEPT_KEY = 'notif:pending_accept';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS && detail?.pressAction?.id === 'open_accept') {
    const data = detail?.notification?.data || {};
    // Persist for the UI to read on next start/resume
    await AsyncStorage.setItem(PENDING_ACCEPT_KEY, JSON.stringify(data));
  }
});



AppRegistry.registerComponent(appName, () => App);
