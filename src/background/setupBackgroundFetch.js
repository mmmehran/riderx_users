// src/background/setupBackgroundFetch.ts
import BackgroundFetch from 'react-native-background-fetch';
import notifee, { AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getData } from '../services/common.service';
import urls from '../services/urls.json';

const LAST_DELIVERY_ID_KEY = 'bg:lastDeliveryId';
let initOnce = false;
let inFlight = false;

async function ensureAndroidChannel() {
  try {
    await notifee.createChannel({
      id: 'orders',
      name: 'Orders & Alerts',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
  } catch {}
}

async function fetchNewDeliveriesAndNotify() {
  // prevent overlapping runs
  if (inFlight) return;
  inFlight = true;

  try {
    const res = await getData(`${urls.GETLISTDELIVERY}?page=1&status=created`);
    const items = res?.data?.data?.items ?? [];

    if (!Array.isArray(items) || items.length === 0) return;

    // dedupe using the newest id you’ve notified about
    const newest = items[0];
    const newestId = String(newest?.id ?? '');

    const lastId = (await AsyncStorage.getItem(LAST_DELIVERY_ID_KEY)) || '';
    if (newestId && newestId !== lastId) {
      // show local notification
      await notifee.displayNotification({
        title: 'New delivery request',
        body: 'Tap to view details',
        data: { delivery_id: newestId },
        ios: { sound: 'default' },
        android: { channelId: 'orders', smallIcon: 'ic_launcher' },
      });
      await AsyncStorage.setItem(LAST_DELIVERY_ID_KEY, newestId);
    }
  } catch {
    // swallow background errors
  } finally {
    inFlight = false;
  }
}

export async function setupBackgroundFetchOnce() {
  if (initOnce) return;
  initOnce = true;

  // Android channel (no-op on iOS)
  await ensureAndroidChannel();

  await BackgroundFetch.configure(
    {
      // iOS decides the actual cadence; ask for ~15 minutes
      minimumFetchInterval: 15,
      // Keep running after terminate & on device boot when possible.
      // (On iOS, the library uses BGAppRefreshTask where available.)
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
    },
    async (taskId: string) => {
      try {
        await fetchNewDeliveriesAndNotify();
      } finally {
        BackgroundFetch.finish(taskId);
      }
    },
    (error: any) => {
      // init failure — optional log
      // console.log('BackgroundFetch failed to start', error);
    }
  );

  // Kick it off (no effect if already started)
  await BackgroundFetch.start();

  // Optional: do an immediate check at app start (foreground)
  fetchNewDeliveriesAndNotify();
}
