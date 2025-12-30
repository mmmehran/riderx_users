// HomeMainScreen.js
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  AppState,
  TouchableOpacity,
  BackHandler,
  ToastAndroid,
  Image,
  Animated,
  ActivityIndicator,
} from 'react-native';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Mapbox from '@rnmapbox/maps';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import notifee, { AndroidImportance, AuthorizationStatus } from '@notifee/react-native';
import Geolocation from '@react-native-community/geolocation';
import messaging from '@react-native-firebase/messaging';
import { useTranslation } from 'react-i18next';
import BackgroundService from 'react-native-background-actions';

import AcceptOrderModal from '../../../modal/AcceptOrderModal';
import AcceptedOrderModal from '../../../modal/AcceptedOrderModal';
import CancelModal from '../../../modal/CancelModal';
import SelectVehicleModal from '../../../modal/SelectVehicleModal';
import TinderCarousel from '../../../components/custom/TinderCarousel';
import { MAP_BOX_TOKEN } from '@env';

import { LocationPin, Update, ArrowRightWhite1 } from '../../../../assets/svg/index';
import CustomHeader from '../../../components/custom/CustomHeader';
import CustomAvailableRider from '../../../components/custom/CustomAvailableRider';
import { getData, sendData } from '../../../services/common.service';
import urls from '../../../services/urls.json';
import errorHandler from '../../../utils/errorHandler';
import {
  showToast,
  showToastWarning,
  parseSocketUrl,
  isAndroid15Plus,
  isoWithOffsetPlusMinutes,
} from '../../../utils/helpers';
import {
  setUserProfile,
  authenticated,
  setUserWallet,
} from '../../../redux/reducers/authenticationReducer';
import { connectSocket, on, disconnectSocket } from '../../../services/socket';
import {
  selectConfig,
  setSelectVehicle,
  setSocketStatus,
  setSelectVehicleVisible,
  setVehicleData,
  setSelectedOrder1
} from '../../../redux/reducers/configReducer';
import ConfirmModal from '../../../modal/ConfirmModal';
import ConfirmCancelDeliveryModal from '../../../modal/ConfirmCancelDeliveryModal';
import routes from '../../../navigation/routes';
import colors from '../../../config/colors';
import { playDing } from '../../../utils/sounds';
import CustomText from '../../../components/common/CustomText';

const LOCATION_UPDATE_MS = 120 * 1000;
const MAX_FALLBACK_AGE_MS = 5 * 60 * 1000; // 5 min
const BG_GPS_TIMEOUT_MS = 5 * 1000; // shorter timeout -> check cache quicker
const BG_MAXIMUM_AGE_MS = 2 * 60 * 1000; // allow cached fix quickly (2 min)

const MAPBOX_TOKEN = MAP_BOX_TOKEN;
Mapbox.setAccessToken(MAPBOX_TOKEN);

/* ───────── Utils ───────── */
const toNum = v =>
  typeof v === 'number' && Number.isFinite(v)
    ? v
    : Number.isFinite(parseFloat(v))
      ? parseFloat(v)
      : null;

const round5 = v => {
  const x = toNum(v);
  return x == null ? null : Math.round(x * 1e5) / 1e5;
};

const normalizeCoord = coord => {
  if (!Array.isArray(coord) || coord.length < 2) return null;
  const lng = round5(coord[0]);
  const lat = round5(coord[1]);
  return lng == null || lat == null ? null : [lng, lat];
};

const haversineMeters = (a, b) => {
  const R = 6371000,
    toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

const lngLatToXY = ([lng, lat]) => [
  lng * 111320 * Math.cos((lat * Math.PI) / 180),
  lat * 110540,
];

const clamp01 = t => (t < 0 ? 0 : t > 1 ? 1 : t);

const closestOnPolyline = (ptLngLat, coords) => {
  if (!ptLngLat || !coords || coords.length < 2)
    return { idx: 0, point: coords?.[0] };
  const p = lngLatToXY(ptLngLat);
  let bestIdx = 0,
    bestT = 0,
    bestD2 = Infinity,
    bestPoint = coords[0];
  for (let i = 0; i < coords.length - 1; i++) {
    const aLL = coords[i],
      bLL = coords[i + 1];
    const a = lngLatToXY(aLL),
      b = lngLatToXY(bLL);
    const ab = [b[0] - a[0], b[1] - a[1]],
      ap = [p[0] - a[0], p[1] - a[1]];
    const ab2 = ab[0] * ab[0] + ab[1] * ab[1];
    const t = ab2 === 0 ? 0 : clamp01((ap[0] * ab[0] + ap[1] * ab[1]) / ab2);
    const proj = [a[0] + ab[0] * t, a[1] + ab[1] * t];
    const d2 = (p[0] - proj[0]) ** 2 + (p[1] - proj[1]) ** 2;
    if (d2 < bestD2) {
      bestD2 = d2;
      bestIdx = i;
      bestT = t;
      bestPoint = [
        aLL[0] + (bLL[0] - aLL[0]) * t,
        aLL[1] + (bLL[1] - aLL[1]) * t,
      ];
    }
  }
  const idx = bestT >= 0.999 ? bestIdx + 1 : bestIdx;
  return { idx: Math.min(idx, coords.length - 2), point: bestPoint };
};

const stepPrimaryText = step =>
  step?.bannerInstructions?.[0]?.primary?.text ||
  step?.maneuver?.instruction ||
  '';

const normDeg = d => ((d % 360) + 360) % 360;

const bearingAB = (a, b) => {
  const toRad = x => (x * Math.PI) / 180,
    toDeg = x => (x * 180) / Math.PI;
  const [lng1, lat1] = a,
    [lng2, lat2] = b;
  const φ1 = toRad(lat1),
    φ2 = toRad(lat2),
    Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return normDeg(toDeg(Math.atan2(y, x)));
};

const smoothHeading = (prev, next, alpha = 0.25) => {
  if (prev == null) return next;
  const diff = ((next - prev + 540) % 360) - 180;
  return normDeg(prev + alpha * diff);
};

/* ───────── Reroute constants ───────── */
const REROUTE_COOLDOWN_MS = 10_000;
const REROUTE_MIN_MOVE_M = 30;
const OFFROUTE_DISTANCE_M = 120;
const OFFROUTE_PERSIST_MS = 4000;
const OFFROUTE_JUMP_M = 50;

const HomeMainScreen = ({ route }) => {
  const [camera, setCamera] = useState([-74.006, 40.7128]);
  const [userCoordState, setUserCoordState] = useState(null);
  const [userHeadingDeg, setUserHeadingDeg] = useState(0);
  const [mapHeight, setMapHeight] = useState(100);

  const [data, setData] = useState([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(null);
  const [showAcceptOrder, setShowAcceptOrder] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmCancelModalVisible, setConfirmCancelModalVisible] = useState(false);
  const [confirmCompleteModalVisible, setConfirmCompleteModalVisible] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [loadingChangeStatus, setLoadingChangeStatus] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pickUpTimeUpdate, setPickUpTimeUpdate] = useState(null);
  const [showNewOrderBanner, setShowNewOrderBanner] = useState(false);
  const pickUpTimesRef = useRef(new Map());

  const { t } = useTranslation();

  const [routeSteps, setRouteSteps] = useState([]);
  const [routeDistanceM, setRouteDistanceM] = useState(0);
  const [routeDurationSec, setRouteDurationSec] = useState(0);
  const [banner, setBanner] = useState({ primary: '', distance: 0 });
  const [routeCoords, setRouteCoords] = useState([]);
  const [remainingFeature, setRemainingFeature] = useState(null);
  const [traveledFeature, setTraveledFeature] = useState(null);
  const progressIdxRef = useRef(0);

  const [currentStatus, setCurrentStatus] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [securePinShow, setSecurePinShow] = useState(false);

  const [hasLocPerm, setHasLocPerm] = useState(false);
  const [hasBgLocPerm, setHasBgLocPerm] = useState(false);
  const [mapMountKey, setMapMountKey] = useState('map-0');
  const [mapReady, setMapReady] = useState(false);
  const [isNavOn, setIsNavOn] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followMode, setFollowMode] = useState('course');
  const [bearing, setBearing] = useState(0);
  const [completeOrderPrice, setCompleteOrderPrice] = useState(0);
  const [suggestOrder, setSuggestOrder] = useState(null);

  // ETA state
  const [etaSec, setEtaSec] = useState(null);

  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector(authenticated);
  const config = useSelector(selectConfig);

  const selectedOrderRef = useRef(null);
  const channelIdRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const cameraRef = useRef(camera);
  const camRef = useRef(null);
  const userLocRef = useRef(null);
  const abortRef = useRef(null);

  const lastLLRef = useRef(null);
  const headingRef = useRef(null);

  const lastFetchAtRef = useRef(0);
  const lastLegRef = useRef({ from: null, to: null });
  const offRouteSinceRef = useRef(null);
  const lastOnRoutePointRef = useRef(null);

  // throttling & freshness
  const lastLocationTsRef = useRef(0);
  const lastProgressLLRef = useRef(null);
  const lastEtaUpdateRef = useRef(0);
  const lastEtaDistRef = useRef(null);
  const lastFreshLocTsRef = useRef(0);

  // 🔧 BG watcher (prevents TIMEOUT by keeping a live stream of coords)
  const bgWatchIdRef = useRef(null);
  const bgLastCoordsRef = useRef(null);

  const backPressCountRef = useRef(0);
  const backResetTimerRef = useRef(null);

  const sameLegClose = (a, b) =>
    a?.from &&
    a?.to &&
    b?.from &&
    b?.to &&
    haversineMeters(a.from, b.from) < REROUTE_MIN_MOVE_M &&
    haversineMeters(a.to, b.to) < REROUTE_MIN_MOVE_M;

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    return () => {
      // safety cleanup
      if (bgWatchIdRef.current != null) {
        try { Geolocation.clearWatch(bgWatchIdRef.current); } catch { }
        bgWatchIdRef.current = null;
      }
    };
  }, []);

  /* ───────── AppState + background service ───────── */
  useEffect(() => {
    const handleStateChange = nextAppState => {
      // 1. Reconnect Socket and Stop BG Service when coming to Foreground
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        connectSocket({
          baseUrl: parseSocketUrl(user?.socketio).baseUrl,
          roomId: parseSocketUrl(user?.socketio).roomId
        });
        stopBackgroundLocation();
      }

      // 2. Disconnect Socket and Start BG Service when going to Background
      if (nextAppState.match(/inactive|background/)) {
        disconnectSocket(); // Kill socket to save radio power

        const canRunBG =
          !!config?.selectVehicle &&
          config?.selectVehicle?.on_status === 'on' &&
          hasBgLocPerm;

        if (canRunBG && !BackgroundService.isRunning()) {
          startBackgroundLocation();
        }
      }

      appStateRef.current = nextAppState;
    };

    const sub = AppState.addEventListener('change', handleStateChange);
    return () => sub.remove();
  }, [config?.selectVehicle?.on_status, hasBgLocPerm, user?.socketio]);

  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  const resetBackCounter = () => {
    if (backResetTimerRef.current) clearTimeout(backResetTimerRef.current);
    backResetTimerRef.current = null;
    backPressCountRef.current = 0;
  };

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;
      const onBackPress = () => {
        backPressCountRef.current += 1;
        const remaining = 2 - backPressCountRef.current;
        if (remaining > 0) {
          ToastAndroid.show(
            remaining === 1 && t?.('pressBackOneMoreTimeToExit'),
            ToastAndroid.SHORT,
          );
          if (backResetTimerRef.current) clearTimeout(backResetTimerRef.current);
          backResetTimerRef.current = setTimeout(resetBackCounter, 4000);
          return true;
        }
        BackHandler.exitApp();
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        sub?.remove?.();
        resetBackCounter();
      };
    }, [t]),
  );

  useEffect(() => {
    dispatch(setSocketStatus(socketConnected));
  }, [socketConnected, dispatch]);

  useEffect(() => {
    if (route?.params?.multi === 'acceptNewOrder' && route?.params?.order) {
      const { order } = route.params;
      changeStatusOrderAccept(order, 'accepted');
      // Clear params to prevent re-triggering if possible, or reliance on dependency change
      navigation.setParams({ order: null });
    }
  }, [route?.params]);

  /* ───────── Sockets ───────── */
  useEffect(() => {
    const rawUrl = user?.socketio;
    const { baseUrl, roomId } = parseSocketUrl(rawUrl);
    setSocketConnected(false);
    const s = connectSocket({ baseUrl, roomId });

    const offConnect = on('connect', () => setSocketConnected(true));
    const offDisconnect = on('disconnect', () => setSocketConnected(false));
    const offError = on('connect_error', () => setSocketConnected(false));

    const anyLogger = async (event, payload) => {
      if (event === 'delivery_create_by_sender') {
        const orders = [payload?.message].filter(Boolean);
        if (selectedOrderRef.current != null) {
          playDing();
          setSuggestOrder(orders)
          if (showNewOrderBanner) {
            setShowNewOrderBanner(false);
            setTimeout(() => setShowNewOrderBanner(true), 100);

          } else {
            setShowNewOrderBanner(true);
          }
          return;
        }
        setCurrentOrderIndex(null);
        setShowAcceptOrder(false);
        setData(orders);
        if (orders.length > 0) {
          const isActive = appStateRef.current === 'active';
          setCurrentOrderIndex(0);
          setShowAcceptOrder(true);
          setIsAccepted(false);
          if (isActive) playDing();
        } else {
          setCurrentOrderIndex(null);
          setShowAcceptOrder(false);
        }
      } else if (event === 'delivery_update_status_by_sender') {
        if (selectedOrderRef.current?.id !== payload?.message?.id) return;
        if (payload?.message?.status === 'cancel') {
          resetRoute();
          setSelectedOrder(null);
          setIsNavOn(false);
          setIsFollowing(false);
          setConfirmCancelModalVisible(true);
          await showLocalNotification({
            title: t('deliveryCancel'),
            body: t('deliveryWasCancel'),
            data: { delivery_id: String(payload?.message?.id ?? '') },
          });
        }
      } else if (event === 'delivery_accepted_by_rider') {
        if (selectedOrderRef.current != null) return;
        const removedId = payload?.message?.id;
        removeOrderById(removedId);
        showToastWarning(`${t('deliveryId')} ${payload?.message?.id} ${t('acceptByAnother')}`);
      }
    };
    s.onAny(anyLogger);

    if (!user?.authenticated) disconnectSocket();
    return () => {
      setSocketConnected(false);
      offConnect && offConnect();
      offDisconnect && offDisconnect();
      offError && offError();
      try { s.offAny(anyLogger); } catch { }
    };
  }, [user?.socketio, user?.authenticated, t]);

  const removeOrderById = useCallback(
    id => setData(prev => prev.filter(o => o?.id !== id)),
    [],
  );

  /* ───────── Notifications / FCM ───────── */
  const requestNotifPermission = async () => {
    if (Platform.OS === 'android') {
      if (Platform.Version < 33) return true;
      try {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Allow notifications',
            message: 'We use notifications to alert you about new delivery requests.',
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
      return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
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

  const showLocalNotification = useCallback(async ({ title, body, data }) => {
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
            pressAction: { id: 'open_accept', launchActivity: 'default' },
          },
        });
      } else {
        await notifee.displayNotification({
          title,
          body,
          data,
          ios: {
            sound: 'dingios.caf',
            foregroundPresentationOptions: { alert: true, sound: true, badge: true },
          },
          pressAction: { id: 'open_accept' },
        });
      }
    } catch { }
  }, []);

  const ensureFcmPermissionAndToken = async () => {
    try {
      const authStatus = await messaging().requestPermission({
        alert: true,
        badge: true,
        sound: true,
        provisional: true,
      });
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) return null;

      const token = await messaging().getToken();
      try { await sendData(urls.SETFCMTOKEN, { fcm_token: token }); } catch { }

      messaging().onTokenRefresh(async newToken => {
        try { await sendData(urls.SETFCMTOKEN, { fcm_token: newToken }); } catch { }
      });

      return token;
    } catch {
      return null;
    }
  };

  /* ───────── Bootstrap ───────── */
  useEffect(() => {
    let live = true;
    (async () => {
      await requestLocationPermission();
      await new Promise(r => setTimeout(r, 200));
      const notifOk = await requestNotifPermission();
      if (Platform.OS === 'android' && notifOk) await createNotifChannelOnce(channelIdRef);
      await ensureFcmPermissionAndToken();
      if (!live) return;
      getUserProfile();
      getLastDelivery();
    })();
    return () => { live = false; };
  }, []);

  // Request location (fg + bg)
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const ok =
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED ||
          granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;

        let bgOk = ok;

        if (ok && Platform.Version >= 29) {
          const bg = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
            {
              title: 'Allow background location',
              message: 'We need background location to update your position while you are delivering.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            },
          );
          bgOk = bg === PermissionsAndroid.RESULTS.GRANTED;
          // console.log('Background location', bgOk ? 'granted' : 'NOT granted');
        }

        setHasLocPerm(ok);
        setHasBgLocPerm(bgOk);

        if (ok) {
          Geolocation.getCurrentPosition(
            pos => {
              const { latitude, longitude } = pos.coords;
              const ll = [round5(longitude), round5(latitude)];
              if (ll[0] != null && ll[1] != null) {
                setCamera(ll);
                userLocRef.current = ll;
                lastFreshLocTsRef.current = Date.now();
              }
            },
            () => { },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
          );
          setMapMountKey(prev => prev + '-granted');
        }
        return ok;
      } catch (e) {
        console.log('requestLocationPermission error', e);
        setHasLocPerm(false);
        setHasBgLocPerm(false);
        return false;
      }
    }

    // iOS
    try {
      const status = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      let ok = status === RESULTS.GRANTED || status === RESULTS.LIMITED;
      if (!ok && status !== RESULTS.BLOCKED) {
        const res = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        ok = res === RESULTS.GRANTED || res === RESULTS.LIMITED;
      }
      setHasLocPerm(ok);
      setHasBgLocPerm(ok);

      if (ok) {
        Geolocation.getCurrentPosition(
          pos => {
            const { latitude, longitude } = pos.coords;
            const ll = [round5(longitude), round5(latitude)];
            if (ll[0] != null && ll[1] != null) {
              setCamera(ll);
              userLocRef.current = ll;
              lastFreshLocTsRef.current = Date.now();
            }
          },
          () => { },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
        );
        setMapMountKey(prev => prev + '-granted');
      }
      return ok;
    } catch {
      setHasLocPerm(false);
      setHasBgLocPerm(false);
      return false;
    }
  };

  /* ───────── Data fetchers ───────── */
  const getLastDelivery = async () => {
    const response = await getData(urls.GETLASTDELIVERY);
    if (response?.data?.status) {
      const orders = response?.data?.data?.items || [];
      if (orders.length > 0) {
        setSelectedOrder(orders[0]);
        setIsAccepted(true);
        setShowAcceptOrder(false);
        setIsNavOn(true);
        setIsFollowing(true);
        setFollowMode('course');
      } else {
        getDeliveryLists();
      }
    } else {
      errorHandler(response);
    }
  };

  const getDeliveryLists = async () => {
    setCurrentOrderIndex(null);
    setShowAcceptOrder(false);
    const response = await getData(`${urls.GETLISTDELIVERY}?page=1&status=created`);
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
    if (response?.data?.status) dispatch(setUserProfile(response?.data?.data));
    else errorHandler(response);
  };

  /* ───────── Accept / advance ───────── */
  const requireVehicleOrToast = useCallback(() => {
    if (!config?.selectVehicle?.id) {
      showToast(t('firstselectVehicle'), 'error');
      navigation.navigate(routes.CHOOSEVEHICLE);
      return false;
    }
    return true;
  }, [config?.selectVehicle?.id, navigation, t]);

  const handleAcceptOrder = useCallback(
    order => {
      if (!requireVehicleOrToast()) return;
      if (!order) return;
      const mins = pickUpTimesRef.current.get(order.id);
      if (mins != null) setPickUpTimeUpdate(mins);
      changeStatusOrderAccept(order, 'accepted');
    },
    [requireVehicleOrToast],
  );

  const changeStatusOrderAccept = async (order, status, pin, valueResoan) => {
    // status !== 'cancel' && setLoadingChangeStatus(true);
    const response = await sendData(urls.CHANGESTATUSORDER, {
      vehicle_id: config?.selectVehicle?.id,
      delivery_id: order?.id,
      status,
      secure_pin: pin ? pin : null,
      rider_arrive_to_pickup_calculated_time:
        status == 'accepted' ? isoWithOffsetPlusMinutes(pickUpTimeUpdate) : null,
      description: valueResoan ? valueResoan : null,
    });

    if (response?.data?.status) {
      const responseMergeOrder = await getData(status == 'accepted' ? `vehicle/${config?.selectVehicle?.id}/optimal_route?new_delivery_id=${order?.id}` : `vehicle/${config?.selectVehicle?.id}/optimal_route`);
      if (responseMergeOrder?.data?.status) {
        if (responseMergeOrder?.data?.data?.length) {
          const responseDetailOrder = await getData(`${urls.GETLASTDELIVERYDETAIL}?id=${responseMergeOrder?.data?.data[0]?.id}`);
          if (responseDetailOrder?.data?.status) {
            if (status === 'accepted') {
              setMapHeight(60);
              setIsAccepted(true);
              setShowAcceptOrder(false);
              setCurrentOrderIndex(null);
              setIsNavOn(true);
              setIsFollowing(true);
              setFollowMode('course');
            }
            setSelectedOrder(responseDetailOrder?.data?.data);
            dispatch(setSelectedOrder1(responseDetailOrder?.data?.data))
            status === 'completed' ?
              showToast(`${t('anamount')} ${order?.rider_fee} ${t("hasBeen")}`)
              : showToastWarning(t('goNextTrip'))

          }
          else errorHandler(responseDetailOrder);
        } else {
          if (
            ['completed', 'cancel', 'request_new_driver', 'shipment_destroyed', 'address_not_found'].includes(status)
          ) {
            status === 'completed' && setCompleteOrderPrice(order?.rider_fee || 0);
            setMapHeight(100);
            resetRoute();
            setSelectedOrder(null);
            setIsNavOn(false);
            setIsFollowing(false);
            status !== 'completed' && showToast(t('cancelOrder'));
            status === 'completed' && setConfirmCompleteModalVisible(true);
            dispatch(setSelectedOrder1(null))
          }
        }
      }
      else errorHandler(responseMergeOrder);
    } else {
      if (response?.status == 400) {
        removeOrderById(order?.id);
        showToastWarning(`${t('deliveryId')} ${order?.id} ${t('acceptByAnother')}`);
      } else {
        errorHandler(response);
      }
      status !== 'cancel' && setLoadingChangeStatus(false);
      return;
    }
    // status !== 'cancel' && setLoadingChangeStatus(false);
  };

  const currentOrder = currentOrderIndex !== null ? data[currentOrderIndex] : null;

  /* ───────── Destination ───────── */
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
    return normalizeCoord([lng, lat]);
  }, [
    selectedOrder?.id,
    selectedOrder?.status,
    selectedOrder?.sender_longitude,
    selectedOrder?.sender_latitude,
    selectedOrder?.receiver_longitude,
    selectedOrder?.receiver_latitude,
  ]);

  /* ───────── Route fetching + init progress ───────── */
  const resetRoute = () => {
    setRouteCoords([]);
    setRouteSteps([]);
    setRouteDistanceM(0);
    setRouteDurationSec(0);
    setBanner({ primary: '', distance: 0 });
    setTraveledFeature(null);
    setRemainingFeature(null);
    progressIdxRef.current = 0;
    lastOnRoutePointRef.current = null;
    setEtaSec(null);
    if (abortRef.current) abortRef.current.abort();
  };

  const buildLineFeature = coords =>
    coords && coords.length >= 2
      ? { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }
      : null;

  const fetchRoute = useCallback(
    async (from, to) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const profile =
          config?.selectVehicle?.vehicle_type === 'bicycle' ||
            config?.selectVehicle?.vehicle_type === 'e_bicycle' ||
            config?.selectVehicle?.vehicle_type === 'moped'
            ? 'cycling'
            : 'driving';

        const url =
          `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
          `${from[0]},${from[1]};${to[0]},${to[1]}` +
          `?geometries=geojson&overview=full&steps=true&banner_instructions=true&voice_instructions=false&language=en&access_token=${MAPBOX_TOKEN}`;

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const route0 = json?.routes?.[0];
        const geom = route0?.geometry;
        const steps = route0?.legs?.[0]?.steps || [];
        const duration = route0?.duration || 0;
        const distance = route0?.distance || 0;

        if (geom && !controller.signal.aborted) {
          const coords = (geom.coordinates || []).map(normalizeCoord).filter(Boolean);

          setRouteCoords(coords);
          setRouteSteps(steps);
          setRouteDurationSec(duration);
          setRouteDistanceM(distance);
          setBanner({ primary: '', distance: 0 });
          progressIdxRef.current = 0;
          setEtaSec(null);

          const userLL = userLocRef.current || normalizeCoord(cameraRef.current);
          if (userLL) {
            const { idx, point } = closestOnPolyline(userLL, coords);
            progressIdxRef.current = idx;
            const traveled = coords.slice(0, idx + 1);
            traveled[traveled.length - 1] = point;
            const remaining = [point, ...coords.slice(idx + 1)];
            setTraveledFeature(buildLineFeature(traveled));
            setRemainingFeature(buildLineFeature(remaining));
            lastOnRoutePointRef.current = point;
          } else {
            setTraveledFeature(null);
            setRemainingFeature(buildLineFeature(coords));
            lastOnRoutePointRef.current = coords[0];
          }
        }
      } catch (e) {
        // silent
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [config?.selectVehicle?.vehicle_type],
  );

  const guardedFetchRoute = useCallback(
    async (from, to) => {
      if (!isAccepted || !isFollowing) return;
      const now = Date.now();
      if (now - (lastFetchAtRef.current || 0) < REROUTE_COOLDOWN_MS) return;
      const newLeg = { from, to };
      if (sameLegClose(lastLegRef.current, newLeg)) return;
      await fetchRoute(from, to);
      lastFetchAtRef.current = Date.now();
      lastLegRef.current = newLeg;
    },
    [fetchRoute, isAccepted, isFollowing],
  );

  useEffect(() => {
    if (!hasLocPerm) return;
    if (!selectedOrder || !isAccepted || !isFollowing) {
      resetRoute();
      return;
    }
    const from = normalizeCoord(userLocRef.current || cameraRef.current);
    const to = normalizeCoord(senderCoordinate);
    if (!from || !to) return;
    guardedFetchRoute(from, to);
  }, [hasLocPerm, isAccepted, isFollowing, selectedOrder?.id, senderCoordinate, guardedFetchRoute]);

  useEffect(() => {
    lastLegRef.current = { from: null, to: null };
    lastFetchAtRef.current = 0;
  }, [selectedOrder?.id, senderCoordinate?.[0], senderCoordinate?.[1]]);

  /* ───────── Live progress + banner + ETA ───────── */
  const updateBannerAndSteps = useCallback(
    userLL => {
      if (!routeSteps.length) return;
      const idx = Math.min(progressIdxRef.current, routeSteps.length - 1);
      const currentStep = routeSteps[idx];
      const nextLoc = currentStep?.maneuver?.location;
      const nextPt =
        Array.isArray(nextLoc) && nextLoc.length === 2 ? normalizeCoord(nextLoc) : null;
      if (!nextPt) return;

      const d = Math.max(0, Math.round(haversineMeters(userLL, nextPt)));
      if (d < 30 && idx < routeSteps.length - 1) progressIdxRef.current = idx + 1;

      setBanner({ primary: stepPrimaryText(currentStep), distance: d });

      let remainingM = d;
      for (let i = idx + 1; i < routeSteps.length; i++) remainingM += routeSteps[i]?.distance || 0;

      const now = Date.now();
      const distChangedEnough =
        lastEtaDistRef.current == null || Math.abs(remainingM - lastEtaDistRef.current) > 50;
      const timeOk = now - lastEtaUpdateRef.current > 5000;
      if (!distChangedEnough || !timeOk) return;

      lastEtaUpdateRef.current = now;
      lastEtaDistRef.current = remainingM;

      let eta = null;
      if (routeDistanceM > 0 && routeDurationSec > 0 && remainingM > 0) {
        const avgSpeed = routeDistanceM / routeDurationSec;
        eta = remainingM / avgSpeed;
      } else if (remainingM > 0) {
        eta = remainingM / 8.33;
      }

      if (eta && Number.isFinite(eta) && eta > 0) setEtaSec(eta);
      else setEtaSec(null);
    },
    [routeSteps, routeDistanceM, routeDurationSec],
  );

  const updateRouteProgress = useCallback(
    userLL => {
      if (!routeCoords || routeCoords.length < 2) return;
      const { idx, point } = closestOnPolyline(userLL, routeCoords);
      const nextIdx = Math.max(idx, progressIdxRef.current);
      progressIdxRef.current = nextIdx;

      const traveled = routeCoords.slice(0, nextIdx + 1);
      traveled[traveled.length - 1] = point;
      const remaining = [point, ...routeCoords.slice(nextIdx + 1)];

      setTraveledFeature(buildLineFeature(traveled));
      setRemainingFeature(buildLineFeature(remaining));
      lastOnRoutePointRef.current = point;
    },
    [routeCoords],
  );

  /* ───────── USER LOCATION updates (foreground Mapbox) ───────── */
  const onUserLocation = useCallback(
    async location => {
      if (!location?.coords) return;

      const now = Date.now();
      if (now - lastLocationTsRef.current < 1000) return;
      lastLocationTsRef.current = now;

      const { latitude, longitude, heading, course } = location.coords;
      const userLL = [round5(longitude), round5(latitude)];
      if (userLL[0] == null || userLL[1] == null) return;

      // ✅ keep prev before overwrite (fix heading/bearing bug)
      const prevLL = lastLLRef.current;

      setUserCoordState(userLL);
      userLocRef.current = userLL;
      lastLLRef.current = userLL;
      lastFreshLocTsRef.current = Date.now();

      let hdg = toNum(heading);
      if (hdg == null || !Number.isFinite(hdg)) hdg = toNum(course);

      if ((hdg == null || hdg === 0) && prevLL) {
        const dist = haversineMeters(prevLL, userLL);
        if (dist > 1) hdg = bearingAB(prevLL, userLL);
      }

      if (hdg != null && Number.isFinite(hdg)) {
        const smoothed = smoothHeading(headingRef.current ?? normDeg(hdg), normDeg(hdg));
        headingRef.current = smoothed;
        setUserHeadingDeg(smoothed);
        if (!isFollowing) setBearing(smoothed);
      }

      const lastCam = cameraRef.current;
      const movedForCamera =
        !lastCam ||
        Math.abs(userLL[0] - lastCam[0]) > 0.0005 ||
        Math.abs(userLL[1] - lastCam[1]) > 0.0005;

      if (!isFollowing && movedForCamera) setCamera(userLL);

      const MIN_MOVE_FOR_ROUTE = 5;
      let movedForRoute = true;
      if (lastProgressLLRef.current) {
        const dRoute = haversineMeters(lastProgressLLRef.current, userLL);
        movedForRoute = dRoute > MIN_MOVE_FOR_ROUTE;
      }
      if (movedForRoute) {
        lastProgressLLRef.current = userLL;

        if (isFollowing && routeCoords.length > 1) {
          updateRouteProgress(userLL);
          updateBannerAndSteps(userLL);
        }
      }

      try {
        if (isAccepted && senderCoordinate && routeCoords?.length >= 2) {
          if (!lastOnRoutePointRef.current) {
            const { point } = closestOnPolyline(userLL, routeCoords);
            lastOnRoutePointRef.current = point;
          }

          const dFromAnchor = haversineMeters(userLL, lastOnRoutePointRef.current);

          if (dFromAnchor > OFFROUTE_JUMP_M) {
            const now2 = Date.now();
            if (now2 - (lastFetchAtRef.current || 0) > REROUTE_COOLDOWN_MS) {
              await fetchRoute(userLL, senderCoordinate);
              lastFetchAtRef.current = now2;
              lastLegRef.current = { from: userLL, to: senderCoordinate };
            }
          }
        }
      } catch { }
    },
    [
      isFollowing,
      routeCoords.length,
      updateRouteProgress,
      updateBannerAndSteps,
      isAccepted,
      senderCoordinate,
      fetchRoute,
    ],
  );

  /* ───────── Off-route safety net ───────── */
  useEffect(() => {
    if (!routeSteps.length) return;
    const id = setInterval(() => {
      if (!isAccepted || !isFollowing) return;

      const userLL = userLocRef.current;
      if (!userLL) return;
      if (appStateRef.current !== 'active') return;

      let d = Infinity;
      const anchor = lastOnRoutePointRef.current;

      if (anchor) {
        d = haversineMeters(userLL, anchor);
      } else if (remainingFeature?.geometry?.coordinates?.length >= 2) {
        const { point } = closestOnPolyline(userLL, remainingFeature.geometry.coordinates);
        d = haversineMeters(userLL, point);
      } else if (routeCoords?.length >= 2) {
        const { point } = closestOnPolyline(userLL, routeCoords);
        d = haversineMeters(userLL, point);
      }

      if (!Number.isFinite(d)) return;

      if (d > OFFROUTE_DISTANCE_M) {
        if (!offRouteSinceRef.current) offRouteSinceRef.current = Date.now();
        const elapsed = Date.now() - offRouteSinceRef.current;
        if (elapsed >= OFFROUTE_PERSIST_MS) {
          const to = senderCoordinate;
          if (to) {
            lastFetchAtRef.current = 0;
            lastLegRef.current = { from: null, to: null };
            guardedFetchRoute(userLL, to);
          }
          offRouteSinceRef.current = null;
        }
      } else {
        offRouteSinceRef.current = null;
      }
    }, 3000);

    return () => clearInterval(id);
  }, [
    routeSteps,
    remainingFeature?.geometry,
    routeCoords,
    senderCoordinate,
    guardedFetchRoute,
    isAccepted,
    isFollowing,
  ]);

  /* ───────── Background + foreground location post ───────── */
  const locationInFlightRef = useRef(false);

  const postLocation = useCallback(
    async (overrideLL, source = 'auto') => {
      if (!config?.selectVehicle?.id) return;
      if (locationInFlightRef.current) return;
      if (config?.selectVehicle?.on_status !== 'on') return;

      const loc = overrideLL || userLocRef.current || cameraRef.current;
      const norm = normalizeCoord(loc);
      if (!norm) return;

      let dir = headingRef.current != null ? Math.round(headingRef.current) : null;
      //if (dir == null) dir = 0;
      if (dir == null) return
      locationInFlightRef.current = true;
      try {
        // If your backend doesn't accept "source", remove it.
        await sendData(urls.UPDATELOCATION, {
          longitude: norm[0],
          latitude: norm[1],
          heading: dir,
          vehicle_id: config?.selectVehicle?.id,
          source,
        });
      } catch (e) {
        console.log('UPDATELOCATION error', e);
      } finally {
        locationInFlightRef.current = false;
      }
    },
    [config?.selectVehicle?.id, config?.selectVehicle?.on_status],
  );

  // FOREGROUND interval
  useEffect(() => {
    const fireIfActive = () => {
      if (appStateRef.current === 'active') postLocation(null, 'fg');
    };

    const first = setTimeout(fireIfActive, 3000);
    const id = setInterval(fireIfActive, LOCATION_UPDATE_MS);

    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [postLocation]);

  /* ───────── BG: keep a watchPosition running (big fix for TIMEOUT) ───────── */
  const startBgWatch = useCallback(() => {
    if (bgWatchIdRef.current != null) return;

    try {
      const id = Geolocation.watchPosition(
        pos => {
          const { latitude, longitude } = pos?.coords || {};
          if (latitude == null || longitude == null) return;

          const ll = [round5(longitude), round5(latitude)];
          if (ll[0] == null || ll[1] == null) return;

          bgLastCoordsRef.current = ll;
          userLocRef.current = ll;
          lastLLRef.current = ll;
          lastFreshLocTsRef.current = Date.now();
        },
        err => { console.log('BG watchPosition ERROR', err); },
        {
          enableHighAccuracy: true,
          distanceFilter: 10,       // Only triggers if rider moves > 10m
          interval: 120000,         // Target 120s interval
          fastestInterval: 60000,   // Limit updates to no more than once a minute
          maximumAge: 120000,       // Allow slightly older cached data
          allowsBackgroundLocationUpdates: true,
          pausesLocationUpdatesAutomatically: true,
          showsBackgroundLocationIndicator: true,
          activityType: 'AutomotiveNavigation',
        },
      );

      bgWatchIdRef.current = id;
    } catch (e) {
      console.log('BG watchPosition start error', e);
    }
  }, []);

  const stopBgWatch = useCallback(() => {
    if (bgWatchIdRef.current == null) return;
    try {
      Geolocation.clearWatch(bgWatchIdRef.current);
    } catch { }
    console.log('BG watchPosition stopped');
    bgWatchIdRef.current = null;
  }, []);

  const getBgOneShot = (highAccuracy = true) =>
    new Promise(resolve => {
      Geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos?.coords || {};
          if (latitude == null || longitude == null) return resolve(null);
          const ll = [round5(longitude), round5(latitude)];
          resolve(ll[0] == null || ll[1] == null ? null : ll);
        },
        err => {
          console.log(`BG getCurrentPosition ERROR (BG) high=${highAccuracy}`, err);
          resolve(null);
        },
        {
          enableHighAccuracy: highAccuracy, // ✅ parameterize
          timeout: BG_GPS_TIMEOUT_MS,
          maximumAge: BG_MAXIMUM_AGE_MS, // ✅ allow cached
        },
      );
    });

  // BACKGROUND: background-actions service
  const backgroundLocationTask = async ({ delay }) => {
    startBgWatch();

    try {
      while (BackgroundService.isRunning()) {
        // 1. Wait 120 seconds
        await new Promise(r => setTimeout(r, delay || 120000));

        if (appStateRef.current === 'active') continue;

        const now = Date.now();
        const lastTs = lastFreshLocTsRef.current || 0;
        const ageMs = now - lastTs;

        let fresh = null;

        // 2. Only perform active GPS polling if current data is too old (> 120s)
        if (ageMs > 120000) {
          fresh = await getBgOneShot(true);
          if (fresh) {
            userLocRef.current = fresh;
            lastFreshLocTsRef.current = now;
          }
        } else {
          // Use data from the 10m watcher
          fresh = bgLastCoordsRef.current || userLocRef.current;
        }

        // 3. Post to server
        if (fresh && ageMs < MAX_FALLBACK_AGE_MS) {
          postLocation(fresh, 'bg');
        }
      }
    } catch (err) {
      console.log('BG task CRASHED', err);
    } finally {
      stopBgWatch();
    }
  };

  const backgroundOptions = {
    taskName: 'RiderLocation',
    taskTitle: 'Sharing your location',
    taskDesc: 'We keep your position updated for deliveries.',
    taskIcon: { name: 'ic_launcher', type: 'mipmap' },
    color: '#FF6B00',
    linkingURI: 'riderx://home',
    parameters: { delay: LOCATION_UPDATE_MS },
  };

  const startBackgroundLocation = async () => {
    if (BackgroundService.isRunning()) return;

    if (
      appStateRef.current !== 'background' ||
      !config?.selectVehicle ||
      config?.selectVehicle?.on_status !== 'on' ||
      !hasBgLocPerm
    ) {
      //console.log('startBackgroundLocation: conditions not met', {
      //  appState: appStateRef.current,
      //  onStatus: config?.selectVehicle?.on_status,
      //  hasBgLocPerm,
      //});
      return;
    }

    try {
      // console.log('startBackgroundLocation: starting BG service');
      await BackgroundService.start(backgroundLocationTask, backgroundOptions);
    } catch (e) {
      console.log('BG start error', e);
    }
  };

  const stopBackgroundLocation = async () => {
    try {
      stopBgWatch();
      if (BackgroundService.isRunning()) await BackgroundService.stop();
    } catch (e) {
      console.log('BG stop error', e);
    }
  };

  /* ───────── Center-on-me FAB ───────── */
  const getOneShotGPS = () =>
    new Promise(resolve => {
      Geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords || {};
          resolve(
            latitude != null && longitude != null
              ? [round5(longitude), round5(latitude)]
              : null,
          );
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    });

  const onPressMyLocation = useCallback(async () => {
    if (!mapReady) return;
    let target = userCoordState || userLocRef.current;
    if (!target) target = await getOneShotGPS();
    if (!target) return;

    setIsFollowing(false);
    requestAnimationFrame(() => {
      camRef.current?.setCamera({
        followUserLocation: false,
        centerCoordinate: target,
        zoomLevel: 18,
        pitch: 55,
        animationDuration: 250,
      });

      setTimeout(async () => {
        setFollowMode('course');
        setIsFollowing(true);

        const to = senderCoordinate;
        if (to && isAccepted) {
          lastFetchAtRef.current = 0;
          lastLegRef.current = { from: null, to: null };
          const from = normalizeCoord(target);
          if (from) await guardedFetchRoute(from, to);
        }
      }, 280);
    });
  }, [mapReady, isAccepted, senderCoordinate, guardedFetchRoute, userCoordState]);

  const userCoordMemo = useMemo(() => normalizeCoord(camera) ?? camera, [camera]);

  const getWallet = async () => {
    const response = await getData(urls.GETWALLET);
    if (response?.data?.status) dispatch(setUserWallet(response?.data?.data));
    else errorHandler(response);
  };

  const getVehicle = async () => {
    const response = await getData(`${urls.GETVEHICLE}?page=1`);
    if (response?.data?.status) dispatch(setVehicleData(response?.data?.data?.items));
    else errorHandler(response);
  };

  useFocusEffect(useCallback(() => { getWallet(); getVehicle(); }, []));

  const updateVehicleStatus = async () => {
    const response = await sendData(urls.UPDATESTATUSVEHICLE, {
      id: config?.selectVehicle?.id,
      on_status: config?.selectVehicle?.on_status == 'on' ? 'off' : 'on',
    });
    if (response?.data?.status) getVehicleStatus();
    else errorHandler(response);
  };

  const getVehicleStatus = async () => {
    const response = await getData(`${urls.GETVEHICLEDETAIL}?id=${config?.selectVehicle?.id}`);
    if (response?.data?.status) dispatch(setSelectVehicle(response?.data?.data));
    else errorHandler(response);
  };

  useEffect(() => {
    if (config?.selectVehicle) getVehicleStatus();
  }, []);


  const formatDistance = (distanceInMeters) => {
    if (distanceInMeters >= 1000) {
      return (distanceInMeters / 1000).toFixed(1) + ' km';
    }
    return distanceInMeters + ' m';
  }

  const etaMinutes =
    etaSec != null && Number.isFinite(etaSec) ? Math.max(1, Math.round(etaSec / 60)) : null;

  /* ───────── Render ───────── */
  const slideAnim = useRef(new Animated.Value(-wp(100))).current;

  useEffect(() => {
    if (showNewOrderBanner) {
      slideAnim.setValue(-wp(100));
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.delay(10000),
        Animated.timing(slideAnim, {
          toValue: wp(100),
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setShowNewOrderBanner(false);
        }
      });
    }
  }, [showNewOrderBanner]);


  return (
    <>
      <View style={[styles.container, isAndroid15Plus && { marginBottom: hp(6) }]}>
        <CustomHeader onRefreshPress={onPressMyLocation} order={selectedOrder} />
        {showNewOrderBanner && <AnimatedTouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate(routes.NEXTTRIP, { data: suggestOrder, show: false })}
          style={[styles.nextTripContainer, { transform: [{ translateX: slideAnim }] }]}>
          <CustomText style={styles.textTrip}>{t("nextTrip")}</CustomText>
          <View style={{ marginTop: hp(0.2) }}>
            <ArrowRightWhite1 width={wp(6)} height={wp(6)} />
          </View>
        </AnimatedTouchableOpacity>}
        <View style={styles.mapWrap}>
          {hasLocPerm ? (
            <>
              <Mapbox.MapView
                key={mapMountKey}
                scaleBarEnabled={false}
                styleURL={config?.mapStyle == 'dark' ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Light}
                zoomEnabled
                rotateEnabled
                style={[styles.map, { height: hp(mapHeight) }]}
                onDidFinishLoadingMap={() => setMapReady(true)}
              >
                {remainingFeature && (
                  <Mapbox.ShapeSource id="remainingSource" shape={remainingFeature}>
                    <Mapbox.LineLayer
                      id="remainingLine"
                      style={{
                        lineColor: '#000',
                        lineWidth: 15,
                        lineJoin: 'round',
                        lineCap: 'round',
                      }}
                    />
                  </Mapbox.ShapeSource>
                )}

                {traveledFeature && (
                  <Mapbox.ShapeSource id="traveledSource" shape={traveledFeature}>
                    <Mapbox.LineLayer
                      id="traveledLine"
                      style={{
                        lineColor: '#FFE710',
                        lineWidth: 13,
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

                <Mapbox.UserLocation
                  visible={false}
                  showsUserHeadingIndicator
                  androidRenderMode="gps"
                  onUpdate={onUserLocation}
                />

                {isFollowing ? (
                  <Mapbox.Camera
                    ref={camRef}
                    followUserLocation
                    followUserMode={followMode}
                    followZoomLevel={isNavOn ? 17 : 15}
                    followPitch={isNavOn ? 65 : 0}
                    animationMode="flyTo"
                    animationDuration={1000}
                  />
                ) : (
                  <Mapbox.Camera
                    ref={camRef}
                    centerCoordinate={camera}
                    zoomLevel={13}
                    bearing={bearing}
                    animationMode="flyTo"
                    animationDuration={800}
                  />
                )}

                {userCoordState && (
                  <Mapbox.MarkerView coordinate={userCoordState}>
                    {config?.selectVehicle?.vehicle_type == 'bicycle' ||
                      config?.selectVehicle?.vehicle_type == 'e_bicycle' ||
                      config?.selectVehicle?.vehicle_type == 'moped' ? (
                      <Image
                        source={require('../../../../assets/image/motor.png')}
                        style={{ width: wp(8), height: hp(8) }}
                      />
                    ) : (
                      <Image
                        source={require('../../../../assets/image/car.png')}
                        style={{ width: wp(8), height: hp(8) }}
                      />
                    )}
                  </Mapbox.MarkerView>
                )}
              </Mapbox.MapView>
            </>
          ) : (
            <View style={styles.map} />
          )}
          <View style={styles.overlay} pointerEvents="box-none">
            {banner?.primary ? (
              <View style={styles.banner} pointerEvents="none">
                <CustomText style={styles.bannerTitle}>{banner.primary}</CustomText>
                {!!banner.distance && (
                  <CustomText style={styles.bannerSub}>
                    {formatDistance(banner.distance)} {etaMinutes != null ? `  •  ~${etaMinutes} min` : ''}
                  </CustomText>
                )}
              </View>
            ) : null}
          </View>
        </View>

        {config?.selectVehicle?.on_status == 'off' && (
          <View style={styles.vehicleStatus}>
            <CustomText style={styles.text}>{t('vehicleOff')}</CustomText>
          </View>
        )}

        <TouchableOpacity activeOpacity={0.6} onPress={getDeliveryLists} style={styles.button1}>
          <Update width={wp(5)} height={wp(5)} />
        </TouchableOpacity>

        {!selectedOrder && (
          <CustomAvailableRider
            onAvailabilityChange={updateVehicleStatus}
            toggleValue={config?.selectVehicle?.on_status == 'on'}
          />
        )}

        {!isAccepted && showAcceptOrder && data.length > 0 && (
          <View style={styles.tinderWrap} pointerEvents="box-none">
            <TinderCarousel
              key={`deck-${data[0]?.id ?? 'x'}-${data.length}`}
              data={data}
              renderItem={({ item }) => (
                <AcceptOrderModal
                  order={item}
                  userCoord={userCoordMemo}
                  onAccept={() => handleAcceptOrder(item)}
                  pickUpTime={mins => pickUpTimesRef.current.set(item.id, mins)}
                />
              )}
              cardWidth={wp(100)}
              cardHeight={hp(32.3)}
              stackCount={Math.min(4, data.length)}
              stackScale={0.94}
              stackOffset={19.5}
              onIndexChange={i => {
                if (i >= data.length) {
                  setShowAcceptOrder(false);
                  setCurrentOrderIndex(null);
                }
              }}
            />
          </View>
        )}
      </View>

      {selectedOrder && (
        <AcceptedOrderModal
          key={selectedOrder?.id}
          insets={insets}
          changeOrder={(status, pin) => {
            setCurrentStatus(status);
            if (status === 'cancel' && selectedOrder?.status === 'pickup') {
              setCancelModalVisible(true);
            } else if (status === 'cancel' && selectedOrder?.status === 'accepted') {
              setConfirmModalVisible(true);
            } else if (pin) {
              setSecurePinShow(true);
              setConfirmModalVisible(true);
            } else {
              changeStatusOrderAccept(selectedOrder, status, pin);
            }
          }}
          order={selectedOrder}
          onModalPosition={value => {
            !value ? setMapHeight(60) : setMapHeight(100);
          }}
        // loading={loadingChangeStatus}
        />
      )}

      <CancelModal
        isVisible={cancelModalVisible}
        onSelectReason={(reasonKey, text) => {
          changeStatusOrderAccept(selectedOrder, reasonKey, null, text);
          setCancelModalVisible(false);
        }}
        onClose={() => setCancelModalVisible(false)}
      />

      <SelectVehicleModal
        isVisible={config?.selectVehicleVisible}
        onSelectReason={() => {
          dispatch(setSelectVehicleVisible(!config?.selectVehicleVisible));
        }}
        onClose={() => dispatch(setSelectVehicleVisible(!config?.selectVehicleVisible))}
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
        title={t('titleCancel')}
        content={t('cancelContent')}
        confirmText={t('gotIt')}
        type={false}
        isVisible={confirmCancelModalVisible}
        onCancel={() => setConfirmCancelModalVisible(false)}
        onConfirm={() => setConfirmCancelModalVisible(false)}
      />

      <ConfirmCancelDeliveryModal
        title={t('completeTrip')}
        type={true}
        content1={t('anamount')}
        content2={t('hasBeen')}
        price={completeOrderPrice}
        confirmText={t('goOnline')}
        isVisible={confirmCompleteModalVisible}
        onCancel={() => setConfirmCompleteModalVisible(false)}
        onConfirm={() => setConfirmCompleteModalVisible(false)}
      />

    </>
  );
};

export default HomeMainScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  nextTripContainer: {
    width: wp(50),
    height: hp(4.8),
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: wp(2.5),
    borderColor: colors.neonYellow,
    borderWidth: wp(0.6),
    position: "absolute",
    top: hp(11),
    left: wp(4),
    zIndex: 999,
    flexDirection: "row"
  },
  textTrip: {
    color: colors.white,
    fontSize: wp(4),
    fontWeight: "bold",
    marginRight: wp(1)
  },
  button1: {
    width: wp(10.5),
    height: wp(10.5),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(2),
    backgroundColor: colors.white,
    borderColor: colors.neutral200,
    borderWidth: wp(0.4),
    position: 'absolute',
    right: wp(4),
    bottom: hp(9),
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
  text: { fontWeight: 'bold', color: colors.white, fontSize: wp(7) },
  mapWrap: { flex: 1, width: wp(100), position: 'relative' },
  map: { width: wp(100), height: hp(100) },
  overlay: {
    position: 'absolute',
    top: hp(15),
    left: wp(2.3),
    right: wp(2.3),
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  banner: {
    position: 'absolute',
    top: hp(2),
    width: wp(110),
    left: wp(-5),
    paddingVertical: hp(1.5),
    paddingRight: wp(10),
    paddingLeft: wp(6),
    backgroundColor: '#B5FFF066',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTitle: { color: colors.neutral900, fontSize: wp(4) },
  bannerSub: { color: colors.neutral900, fontSize: wp(4.5), fontFamily: 'YaldeviJaffna-Bold' },
  tinderWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    // backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
});
