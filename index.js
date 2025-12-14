/**
 * @format
 */

import notifee from '@notifee/react-native';
import {AppRegistry} from 'react-native';
import App from './App';

// Handle background events for notifications
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // We can handle specific actions here if needed
  // For now, just having the listener prevents the warning
  // and allows the service to run smoothly
});
import {name as appName} from './app.json';


AppRegistry.registerComponent(appName, () => App);
