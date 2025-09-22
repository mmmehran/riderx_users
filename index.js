/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import { setupBackgroundFetchOnce } from './src/background/setupBackgroundFetch';

// start background fetch once at boot
setupBackgroundFetchOnce();

AppRegistry.registerComponent(appName, () => App);
