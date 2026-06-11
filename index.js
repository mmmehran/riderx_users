/**
 * @format
 */

import notifee from '@notifee/react-native';
import { AppRegistry } from 'react-native';
import App from './App';
import WebEngage from 'react-native-webengage';
import messaging from '@react-native-firebase/messaging';



// Handle background events for notifications
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // We can handle specific actions here if needed
  // For now, just having the listener prevents the warning
  // and allows the service to run smoothly
});

import { name as appName } from './app.json';

// Register background handler for killed/Background state
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  const webengage = new WebEngage();
  // Pass push payload to WebEngage
  webengage.push.onMessageReceived(remoteMessage);                // Add This
});


AppRegistry.registerComponent(appName, () => App);
