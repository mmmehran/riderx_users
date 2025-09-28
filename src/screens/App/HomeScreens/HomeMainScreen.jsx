import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  AppState,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Mapbox from '@rnmapbox/maps';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';
import Geolocation from '@react-native-community/geolocation';
import messaging from '@react-native-firebase/messaging'; // ⬅️ NEW

import AcceptOrderModal from '../../../modal/AcceptOrderModal';
import AcceptedOrderModal from '../../../modal/AcceptedOrderModal';
import CancelModal from '../../../modal/CancelModal';

import {Marker, LocationPin} from '../../../../assets/svg/index';
import CustomHeader from '../../../components/custom/CustomHeader';
import CustomBottomTab from '../../../components/custom/CustomBottomTab';
import {getData, sendData} from '../../../services/common.service';
import urls from '../../../services/urls.json';
import errorHandler from '../../../utils/errorHandler';
import {
  showToast,
  showToastWarning,
  parseSocketUrl,
  isAndroid15Plus,
} from '../../../utils/helpers';
import {
  setUserProfile,
  authenticated,
} from '../../../redux/reducers/authenticationReducer';
import {connectSocket, on, disconnectSocket} from '../../../services/socket';
import {selectConfig} from '../../../redux/reducers/configReducer';
import ConfirmModal from '../../../modal/ConfirmModal';
import ConfirmCancelDeliveryModal from '../../../modal/ConfirmCancelDeliveryModal';
import routes from '../../../navigation/routes';
import colors from '../../../config/colors';
import {playDing} from '../../../utils/sounds';
import CustomText from '../../../components/common/CustomText';

const LOCATION_UPDATE_MS = 30 * 1000;
const POLL_MS = 2 * 60 * 1000;

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiYnl0ZWJyaWRnZXIiLCJhIjoiY21kZzVoNnU2MGlhcDJpcGVuNGV1amYxdyJ9.YMqlR9OovVOp-pm9yGK7eA';

// Set once at module scope
Mapbox.setAccessToken(MAPBOX_TOKEN);

/* ──────────────────────────────────────────────────────────────────────────
   Utilities (safe rounding, normalization, debounce, tiny cache)
   ────────────────────────────────────────────────────────────────────────── */
const toNum = v => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const x = parseFloat(v);
    return Number.isFinite(x) ? x : null;
  }
  return null;
};

const round5 = v => {
  const x = toNum(v);
  if (x === null) return null;
  return Math.round(x * 1e5) / 1e5; // avoid .toFixed on undefined
};

const normalizeCoord = coord => {
  if (!Array.isArray(coord) || coord.length < 2) return null;
  const lng = round5(coord[0]);
  const lat = round5(coord[1]);
  if (lng === null || lat === null) return null;
  return [lng, lat];
};

const coordKey = (lng, lat) => {
  const L = round5(lng);
  const A = round5(lat);
  return L === null || A === null ? '' : `${L},${A}`;
};

const legKey = (from, to) =>
  `${coordKey(from[0], from[1])}->${coordKey(to[0], to[1])}`;

const useDebounced = (value, delay = 400) => {
  const [deb, setDeb] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDeb(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return deb;
};

// tiny route cache
const routeCache = new Map(); // key: legKey, value: geometry
const MAX_CACHE = 30;
const cacheSet = (k, v) => {
  if (!routeCache.has(k) && routeCache.size >= MAX_CACHE) {
    const first = routeCache.keys().next().value;
    routeCache.delete(first);
  }
  routeCache.set(k, v);
};

/* ──────────────────────────────────────────────────────────────────────────
   Notifications permission helpers
   ────────────────────────────────────────────────────────────────────────── */
const requestNotifPermission = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true;
    try {
      const res = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Allow notifications',
          message:
            'We use notifications to alert you about new delivery requests.',
          buttonPositive: 'Allow',
          buttonNegative: 'Deny',
        },
      );
      return res === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }
  try {
    const settings = await notifee.requestPermission({
      alert: true,
      badge: true,
      sound: true,
    });
    const status = settings.authorizationStatus;
    return (
      status === AuthorizationStatus.AUTHORIZED ||
      status === AuthorizationStatus.PROVISIONAL
    );
  } catch {
    return false;
  }
};

const createNotifChannelOnce = async ref => {
  if (Platform.OS !== 'android') return null;
  if (ref.current) return ref.current;
  try {
    ref.current = await notifee.createChannel({
      id: 'firebase_v1',
      name: 'Orders & Alerts',
      importance: AndroidImportance.HIGH,
      sound: 'ding',
      vibration: true,
    });
  } catch {
    ref.current = 'orders';
  }
  return ref.current;
};

/* ──────────────────────────────────────────────────────────────────────────
   Screen
   ────────────────────────────────────────────────────────────────────────── */
const HomeMainScreen = ({route}) => {
  const [camera, setCamera] = useState([-74.006, 40.7128]);
  const [data, setData] = useState([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(null);
  const [showAcceptOrder, setShowAcceptOrder] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmCancelModalVisible, setConfirmCancelModalVisible] =
    useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [loadingChangeStatus, setLoadingChangeStatus] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Route feature (GeoJSON Feature)
  const [routeFeature, setRouteFeature] = useState(null);

  const [currentStatus, setCurrentStatus] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [securePinShow, setSecurePinShow] = useState(false);

  const [hasLocPerm, setHasLocPerm] = useState(false);
  const [mapMountKey, setMapMountKey] = useState('map-0');

  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(authenticated);
  const config = useSelector(selectConfig);

  const selectedOrderRef = useRef(null);
  const pollInFlightRef = useRef(false);
  const lastCamRef = useRef(null);
  const cameraRef = useRef(camera);
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  // Helper: open Accept modal from navigation payload
  const openAcceptFromNotifPayload = useCallback(async payload => {
    if (!payload) return;
    if (selectedOrderRef.current) return;
    let item = null;
    if (payload) {
      try {
        item = payload;
      } catch {}
    }

    if (!item) return;
    setCurrentOrderIndex(null);
    setShowAcceptOrder(false);

    setData([item]);
    setTimeout(() => {
      setCurrentOrderIndex(0);
      setShowAcceptOrder(true);
      setIsAccepted(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const payload = route?.params;
    if (payload) {
      openAcceptFromNotifPayload(payload);
    }
  }, [route?.params, openAcceptFromNotifPayload, navigation]);

  const locationInFlightRef = useRef(false);
  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  const channelIdRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      appStateRef.current = state;
    });
    return () => sub.remove();
  }, []);

  // prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const showLocalNotification = useCallback(async ({title, body, data}) => {
    try {
      if (Platform.OS === 'android') {
        const channelId = await createNotifChannelOnce(channelIdRef);
        await notifee.displayNotification({
          title,
          body,
          data,
          android: {
            channelId: channelId || 'orders',
            smallIcon: 'ic_launcher',
            pressAction: {id: 'open_accept', launchActivity: 'default'},
          },
        });
      } else {
        await notifee.displayNotification({
          title,
          body,
          data,
          ios: {
            sound: 'dingios.caf',
            foregroundPresentationOptions: {
              alert: true,
              sound: true,
              badge: true,
            },
          },
          pressAction: {id: 'open_accept'},
        });
      }
    } catch {}
  }, []);

  const ensureFcmPermissionAndToken = async () => {
    try {
      // iOS will prompt; Android no-op (POST_NOTIFICATIONS handled above)
      const authStatus = await messaging().requestPermission({
        alert: true,
        badge: true,
        sound: true,
        provisional: true,
      });

      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) return null;
      const token = await messaging().getToken();
      try {
        await sendData(urls.SETFCMTOKEN, {fcm_token: token});
      } catch (e) {
        console.log(e);
      }

      // Keep backend synced on token rotation
      messaging().onTokenRefresh(async newToken => {
        try {
          await sendData(urls.SETFCMTOKEN, {fcm_token: newToken});
        } catch (e) {
          console.log(e);
        }
      });

      // // fire when in app
      // messaging().onMessage(async remoteMessage => {
      //   // 1. Extract the notification details
      //   const {notification, data} = remoteMessage;
      //   // 2. Use notifee to display the notification
      //   if (notification) {
      //     showLocalNotification({
      //       title: notification.title,
      //       body: notification.body,
      //       data: data
      //         ? {
      //             delivery_id: String(data?.id ?? ''),
      //             delivery_json: JSON.stringify(data || {}),
      //           }
      //         : null,
      //     });
      //   }
      // });

      return token;
    } catch (e) {
      console.log('error exception in firebase configuration');
      console.log(e);
      return null;
    }
  };

  const removeOrderById = useCallback(id => {
    if (id == null) return;
    setData(prev => prev.filter(o => o?.id !== id));
  }, []);

  /* ────────────────────────────────────────────────────────────────────────
     Socket
     ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const rawUrl = user?.socketio;
    const {baseUrl, roomId} = parseSocketUrl(rawUrl);
    setSocketConnected(false);

    const s = connectSocket({baseUrl, roomId});

    const offConnect = on('connect', () => setSocketConnected(true));
    const offDisconnect = on('disconnect', () => setSocketConnected(false));
    const offError = on('connect_error', () => setSocketConnected(false));

    const anyLogger = async (event, payload) => {
      if (event === 'delivery_create_by_sender') {
        if (selectedOrderRef.current != null) return;
        const orders = [payload?.message].filter(Boolean);
        setData(orders);
        if (orders.length > 0) {
          const isActive = appStateRef.current === 'active';
          setCurrentOrderIndex(0);
          setShowAcceptOrder(true);
          setIsAccepted(false);
          if (isActive) playDing();
          // if (!isActive) {
          //   await showLocalNotification({
          //     title: 'New delivery request',
          //     body: 'You have a new delivery request',
          //     data: {
          //       delivery_id: String(payload?.message?.id ?? ''),
          //       delivery_json: JSON.stringify(payload?.message || {}),
          //     },
          //   });
          // }
        } else {
          setCurrentOrderIndex(null);
          setShowAcceptOrder(false);
        }
      } else if (event === 'delivery_update_status_by_sender') {
        if (selectedOrderRef.current?.id !== payload?.message?.id) return;
        if (payload?.message?.status === 'cancel') {
          setRouteFeature(null);
          setSelectedOrder(null);
          setConfirmCancelModalVisible(true);
          await showLocalNotification({
            title: 'Delivery canceled by sender',
            body: 'A delivery was cancelled',
            data: {delivery_id: String(payload?.message?.id ?? '')},
          });
        }
      } else if (event === 'delivery_accepted_by_rider') {
        if (selectedOrderRef.current != null) return;
        const removedId = payload?.message?.id;
        removeOrderById(removedId);
        showToastWarning(
          `Delivery id: ${payload?.message?.id} accepted by another rider`,
        );
      }
    };
    s.onAny(anyLogger);

    if (!user?.authenticated) disconnectSocket();

    return () => {
      setSocketConnected(false);
      offConnect && offConnect();
      offDisconnect && offDisconnect();
      offError && offError();
      try {
        s.offAny(anyLogger);
      } catch {}
    };
  }, [
    user?.socketio,
    user?.authenticated,
    removeOrderById,
    showLocalNotification,
  ]);

  /* ────────────────────────────────────────────────────────────────────────
     Bootstrap: location perm → notif perm → channel → data
     ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    let live = true;
    (async () => {
      await requestLocationPermission();
      await new Promise(r => setTimeout(r, 200));
      const notifOk = await requestNotifPermission();
      if (Platform.OS === 'android' && notifOk) {
        await createNotifChannelOnce(channelIdRef);
      }
      await ensureFcmPermissionAndToken();
      if (!live) return;
      getUserProfile();
      getLastDelivery();
    })();
    return () => {
      live = false;
    };
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        const ok =
          granted['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED ||
          granted['android.permission.ACCESS_COARSE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED;
        setHasLocPerm(ok);
        if (ok) {
          Geolocation.getCurrentPosition(
            pos => {
              const {latitude, longitude} = pos.coords;
              const lng = round5(longitude);
              const lat = round5(latitude);
              if (lng !== null && lat !== null) setCamera([lng, lat]);
            },
            () => {},
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 5000},
          );
          setMapMountKey(prev => prev + '-granted');
        }
        return ok;
      } catch {
        setHasLocPerm(false);
        return false;
      }
    }
    try {
      const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      let ok = status === RESULTS.GRANTED || status === RESULTS.LIMITED;
      if (!ok && status !== RESULTS.BLOCKED) {
        const res = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        ok = res === RESULTS.GRANTED || res === RESULTS.LIMITED;
      }
      setHasLocPerm(ok);
      if (ok) {
        Geolocation.getCurrentPosition(
          pos => {
            const {latitude, longitude} = pos.coords;
            const lng = round5(longitude);
            const lat = round5(latitude);
            if (lng !== null && lat !== null) setCamera([lng, lat]);
          },
          () => {},
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 5000},
        );
        setMapMountKey(prev => prev + '-granted');
      }
      return ok;
    } catch {
      setHasLocPerm(false);
      return false;
    }
  };

  /* ────────────────────────────────────────────────────────────────────────
     Data helpers
     ──────────────────────────────────────────────────────────────────────── */
  const centerToUserLocation = location => {
    if (!location?.coords) return;
    const {latitude, longitude} = location.coords;
    const lng = round5(longitude);
    const lat = round5(latitude);
    if (lng === null || lat === null) return;

    const rounded = [lng, lat];
    const last = lastCamRef.current;
    const movedEnough =
      !last ||
      Math.abs(rounded[0] - last[0]) > 0.0005 ||
      Math.abs(rounded[1] - last[1]) > 0.0005;

    if (movedEnough) {
      lastCamRef.current = rounded;
      setCamera(rounded);
    }
  };

  const getLastDelivery = async () => {
    const response = await getData(urls.GETLASTDELIVERY);
    if (response?.data?.status) {
      const orders = response?.data?.data?.items || [];
      if (orders.length > 0) {
        setSelectedOrder(orders[0]);
        setIsAccepted(true);
        setShowAcceptOrder(false);
      } else {
        getDeliveryLists();
      }
    } else {
      errorHandler(response);
    }
  };

  const getDeliveryLists = async () => {
    const response = await getData(
      `${urls.GETLISTDELIVERY}?page=1&status=created`,
    );
    if (response?.data?.status) {
      const orders = response?.data?.data?.items || [];
      setData(orders);
      if (orders.length > 0) {
        playDing();
        setCurrentOrderIndex(0);
        setShowAcceptOrder(true);
        setIsAccepted(false);
      } else {
        setCurrentOrderIndex(null);
        setShowAcceptOrder(false);
      }
    } else {
      errorHandler(response);
    }
  };

  const getUserProfile = async () => {
    const response = await getData(urls.GETUSER);
    if (response?.data?.status) {
      dispatch(setUserProfile(response?.data?.data));
    } else {
      errorHandler(response);
    }
  };

  /* ────────────────────────────────────────────────────────────────────────
     Accept / advance handlers (memoized)
     ──────────────────────────────────────────────────────────────────────── */
  const requireVehicleOrToast = useCallback(() => {
    if (!config?.selectVehicle?.id) {
      showToast('Select a vehicle first to accept deliveries.', 'error');
      navigation.navigate(routes.CHOOSEVEHICLE);
      return false;
    }
    return true;
  }, [config?.selectVehicle?.id, navigation]);

  const handleNextOrder = useCallback(() => {
    if (isAccepted) {
      setShowAcceptOrder(false);
      return;
    }
    const nextIndex = (currentOrderIndex ?? -1) + 1;
    if (nextIndex < data.length) {
      setShowAcceptOrder(false);
      setTimeout(() => {
        setCurrentOrderIndex(nextIndex);
        setShowAcceptOrder(true);
      }, 300);
    } else {
      setShowAcceptOrder(false);
      setCurrentOrderIndex(null);
    }
  }, [isAccepted, currentOrderIndex, data.length]);

  const changeStatusOrderAccept = async (order, status, pin) => {
    status !== 'cancel' && setLoadingChangeStatus(true);
    const response = await sendData(urls.CHANGESTATUSORDER, {
      vehicle_id: config?.selectVehicle?.id,
      delivery_id: order?.id,
      status: status,
      secure_pin: pin ? pin : null,
    });

    if (response?.data?.status) {
      setSelectedOrder(response?.data?.data);
      if (
        status === 'completed' ||
        status === 'cancel' ||
        status === 'request_new_driver' ||
        status === 'shipment_destroyed' ||
        status === 'address_not_found'
      ) {
        setRouteFeature(null);
        setSelectedOrder(null);
        showToast(
          status === 'completed'
            ? 'The order was successfully placed.'
            : 'The order was canceled.',
        );
      }
    } else {
      errorHandler(response);
    }
    status !== 'cancel' && setLoadingChangeStatus(false);
  };

  const handleAcceptOrder = useCallback(() => {
    if (!requireVehicleOrToast()) return;
    const order = data[currentOrderIndex];
    if (!order) return;
    setSelectedOrder(order);
    changeStatusOrderAccept(order, 'accepted');
    setIsAccepted(true);
    setShowAcceptOrder(false);
    setCurrentOrderIndex(null);
  }, [data, currentOrderIndex, requireVehicleOrToast]);

  const currentOrder =
    currentOrderIndex !== null ? data[currentOrderIndex] : null;

  const senderCoordinate = useMemo(() => {
    if (!selectedOrder) return null;
    const lng =
      selectedOrder?.status !== 'pickup'
        ? selectedOrder?.sender_longitude
        : selectedOrder?.receiver_longitude;
    const lat =
      selectedOrder?.status !== 'pickup'
        ? selectedOrder?.sender_latitude
        : selectedOrder?.receiver_latitude;
    return normalizeCoord([lng, lat]); // [lng, lat] or null
  }, [
    selectedOrder?.id,
    selectedOrder?.status,
    selectedOrder?.sender_longitude,
    selectedOrder?.sender_latitude,
    selectedOrder?.receiver_longitude,
    selectedOrder?.receiver_latitude,
  ]);

  /* ────────────────────────────────────────────────────────────────────────
     Optimized, cancellable, debounced route fetch
     ──────────────────────────────────────────────────────────────────────── */
  const abortRef = useRef(null);
  const debouncedUserCoord = useDebounced(camera, 600);

  const fromKey = useMemo(() => {
    const n = normalizeCoord(debouncedUserCoord);
    return n ? coordKey(n[0], n[1]) : '';
  }, [debouncedUserCoord]);

  const toKey = useMemo(() => {
    const n = normalizeCoord(senderCoordinate);
    return n ? coordKey(n[0], n[1]) : '';
  }, [senderCoordinate]);

  const fetchRoute = useCallback(async (from, to, legK) => {
    const cached = routeCache.get(legK);
    if (cached) {
      if (mountedRef.current)
        setRouteFeature({type: 'Feature', geometry: cached});
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      const res = await fetch(url, {signal: controller.signal});
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const geom = json?.routes?.[0]?.geometry;
      if (geom && mountedRef.current && !controller.signal.aborted) {
        cacheSet(legK, geom);
        setRouteFeature({type: 'Feature', geometry: geom});
      }
    } catch (e) {
      if (e?.name !== 'AbortError') {
        // console.log('route fetch error:', e?.message);
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!hasLocPerm) return;

    // Keep route fetch idle while Accept modal is open / until accepted
    if (!selectedOrder || !isAccepted) {
      setRouteFeature(null);
      if (abortRef.current) abortRef.current.abort();
      return;
    }

    const from = normalizeCoord(debouncedUserCoord);
    const to = normalizeCoord(senderCoordinate);
    if (!from || !to) return;

    const legK = legKey(from, to);
    fetchRoute(from, to, legK);
  }, [
    hasLocPerm,
    isAccepted,
    selectedOrder?.id,
    fromKey,
    toKey,
    fetchRoute,
    debouncedUserCoord,
    senderCoordinate,
  ]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  /* ────────────────────────────────────────────────────────────────────────
     Polling deliveries when idle
     ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (selectedOrder) return;
    const handler = async () => {
      if (showAcceptOrder || pollInFlightRef.current) return;
      try {
        pollInFlightRef.current = true;
        await getDeliveryLists();
      } finally {
        pollInFlightRef.current = false;
      }
    };
    const id = setInterval(handler, POLL_MS);
    if (!user?.authenticated) clearInterval(id);
    return () => clearInterval(id);
  }, [selectedOrder, showAcceptOrder, user?.authenticated]);

  /* ────────────────────────────────────────────────────────────────────────
     Background location post
     ──────────────────────────────────────────────────────────────────────── */
  const postLocation = useCallback(async () => {
    if (!config?.selectVehicle?.id) return;
    if (locationInFlightRef.current) return;
    const cam = cameraRef.current;
    const norm = normalizeCoord(cam);
    if (!norm) return;

    locationInFlightRef.current = true;
    try {
      await sendData(urls.UPDATELOCATION, {
        longitude: norm[0],
        latitude: norm[1],
        vehicle_id: config?.selectVehicle?.id,
      });
    } catch {
    } finally {
      locationInFlightRef.current = false;
    }
  }, [config?.selectVehicle?.id]);

  useEffect(() => {
    const first = setTimeout(postLocation, 3000);
    const id = setInterval(postLocation, LOCATION_UPDATE_MS);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [postLocation]);

  const userCoordMemo = useMemo(
    () => normalizeCoord(camera) ?? camera,
    [camera],
  );

  /* ────────────────────────────────────────────────────────────────────────
     Render
     ──────────────────────────────────────────────────────────────────────── */
  return (
    <>
      {socketConnected && <View style={styles.socketStatusContainer} />}
      <View
        style={[
          styles.container,
          isAndroid15Plus && {marginBottom: hp(insets.bottom * 0.11)},
        ]}>
        <CustomHeader
          onRefreshPress={() => {
            if (selectedOrder || showAcceptOrder) return;
            getDeliveryLists();
          }}
        />

        {hasLocPerm ? (
          <Mapbox.MapView
            key={mapMountKey}
            zoomEnabled
            styleURL="mapbox://styles/mapbox/streets-v12"
            rotateEnabled
            style={styles.map}>
            {routeFeature && selectedOrder && (
              <Mapbox.ShapeSource id="routeSource" shape={routeFeature}>
                <Mapbox.LineLayer
                  id="routeLine"
                  style={{
                    lineColor: '#ff0000',
                    lineWidth: 4,
                    lineJoin: 'round',
                    lineCap: 'round',
                  }}
                />
              </Mapbox.ShapeSource>
            )}

            {senderCoordinate && (
              <Mapbox.MarkerView coordinate={senderCoordinate}>
                <LocationPin width={wp(8)} height={wp(8)} />
              </Mapbox.MarkerView>
            )}

            <Mapbox.UserLocation visible onUpdate={centerToUserLocation} />
            <Mapbox.Camera
              centerCoordinate={camera}
              zoomLevel={13}
              animationMode="flyTo"
              animationDuration={2000}
            />
            <Mapbox.MarkerView coordinate={camera}>
              <Marker />
            </Mapbox.MarkerView>
          </Mapbox.MapView>
        ) : (
          <View style={styles.map} />
        )}
        {config?.selectVehicle?.on_status == 'off' && (
          <View style={styles.vehicleStatus}>
            <CustomText style={styles.text}>Vehicle is off !</CustomText>
          </View>
        )}
        <CustomBottomTab />
      </View>

      {currentOrder?.status === 'created' && showAcceptOrder && !isAccepted && (
        <AcceptOrderModal
          insets={insets}
          key={currentOrder?.id ?? currentOrderIndex}
          isVisible={showAcceptOrder}
          order={currentOrder}
          onClose={handleNextOrder}
          onAccept={handleAcceptOrder}
          userCoord={userCoordMemo}
        />
      )}

      {selectedOrder && (
        <AcceptedOrderModal
          insets={insets}
          changeOrder={(status, pin) => {
            setCurrentStatus(status);
            if (status === 'cancel' && selectedOrder?.status === 'pickup') {
              setCancelModalVisible(true);
            } else if (
              status === 'cancel' &&
              selectedOrder?.status === 'accepted'
            ) {
              setConfirmModalVisible(true);
            } else if (pin) {
              setSecurePinShow(true);
              setConfirmModalVisible(true);
            } else {
              changeStatusOrderAccept(selectedOrder, status, pin);
            }
          }}
          order={selectedOrder}
          loading={loadingChangeStatus}
        />
      )}

      <CancelModal
        isVisible={cancelModalVisible}
        onSelectReason={reasonKey => {
          changeStatusOrderAccept(selectedOrder, reasonKey);
          setCancelModalVisible(false);
        }}
        onClose={() => setCancelModalVisible(false)}
      />

      <ConfirmModal
        securePinShow={securePinShow}
        isVisible={confirmModalVisible}
        onCancel={() => {
          setConfirmModalVisible(false);
          setSecurePinShow(false);
        }}
        onConfirm={pin => {
          changeStatusOrderAccept(selectedOrder, currentStatus, pin);
          setConfirmModalVisible(false);
          setSecurePinShow(false);
        }}
      />

      <ConfirmCancelDeliveryModal
        isVisible={confirmCancelModalVisible}
        onCancel={() => setConfirmCancelModalVisible(false)}
        onConfirm={() => setConfirmCancelModalVisible(false)}
      />
    </>
  );
};

export default HomeMainScreen;

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  socketStatusContainer: {
    position: 'absolute',
    top: hp(3),
    left: wp(7),
    width: wp(3),
    height: wp(3),
    backgroundColor: colors.success,
    zIndex: 9999,
    borderRadius: wp(20),
  },
  vehicleStatus: {
    backgroundColor: colors.red,
    borderRadius: wp(4),
    width: wp(60),
    height: hp(10),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  text: {
    fontWeight: 'bold',
    color: colors.white,
    fontSize: wp(7),
  },
  map: {flex: 1, width: wp(100)},
});
