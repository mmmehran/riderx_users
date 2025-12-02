import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
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
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Mapbox from '@rnmapbox/maps';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';
import Geolocation from '@react-native-community/geolocation';
import messaging from '@react-native-firebase/messaging';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

import AcceptOrderModal from '../../../modal/AcceptOrderModal';
import AcceptedOrderModal from '../../../modal/AcceptedOrderModal';
import CancelModal from '../../../modal/CancelModal';
import SelectVehicleModal from '../../../modal/SelectVehicleModal';
import TinderCarousel from '../../../components/custom/TinderCarousel';

import {LocationPin, Update} from '../../../../assets/svg/index';
import CustomHeader from '../../../components/custom/CustomHeader';
import CustomAvailableRider from '../../../components/custom/CustomAvailableRider';
import {getData, sendData} from '../../../services/common.service';
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
  setUserWallet
} from '../../../redux/reducers/authenticationReducer';
import {connectSocket, on, disconnectSocket} from '../../../services/socket';
import {
  selectConfig,
  setSelectVehicle,
  setSocketStatus,
  setSelectVehicleVisible,
  setVehicleData
} from '../../../redux/reducers/configReducer';
import ConfirmModal from '../../../modal/ConfirmModal';
import ConfirmCancelDeliveryModal from '../../../modal/ConfirmCancelDeliveryModal';
import routes from '../../../navigation/routes';
import colors from '../../../config/colors';
import {playDing} from '../../../utils/sounds';
import CustomText from '../../../components/common/CustomText';

const LOCATION_UPDATE_MS = 30 * 1000;

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiYnl0ZWJyaWRnZXIiLCJhIjoiY21kZzVoNnU2MGlhcDJpcGVuNGV1amYxdyJ9.YMqlR9OovVOp-pm9yGK7eA';
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
    return {idx: 0, point: coords?.[0]};
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
  return {idx: Math.min(idx, coords.length - 2), point: bestPoint};
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

const HomeMainScreen = ({route}) => {
  const [camera, setCamera] = useState([-74.006, 40.7128]);

  // NEW: track live user position & heading for the vehicle icon
  const [userCoordState, setUserCoordState] = useState(null);
  const [userHeadingDeg, setUserHeadingDeg] = useState(0);

  const [data, setData] = useState([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(null);
  const [showAcceptOrder, setShowAcceptOrder] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmCancelModalVisible, setConfirmCancelModalVisible] =
    useState(false);
  const [confirmCompleteModalVisible, setConfirmCompleteModalVisible] =
    useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [loadingChangeStatus, setLoadingChangeStatus] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pickUpTimeUpdate, setPickUpTimeUpdate] = useState(null);
  const pickUpTimesRef = useRef(new Map()); // orderId -> mins (for Accept)
  const {t} = useTranslation();

  const [routeSteps, setRouteSteps] = useState([]);
  const [routeDistanceM, setRouteDistanceM] = useState(0);
  const [routeDurationSec, setRouteDurationSec] = useState(0);
  const [banner, setBanner] = useState({primary: '', distance: 0});
  const [routeCoords, setRouteCoords] = useState([]);
  const [remainingFeature, setRemainingFeature] = useState(null);
  const [traveledFeature, setTraveledFeature] = useState(null);
  const progressIdxRef = useRef(0);

  const [currentStatus, setCurrentStatus] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [securePinShow, setSecurePinShow] = useState(false);

  const [hasLocPerm, setHasLocPerm] = useState(false);
  const [mapMountKey, setMapMountKey] = useState('map-0');
  const [mapReady, setMapReady] = useState(false);
  const [isNavOn, setIsNavOn] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followMode, setFollowMode] = useState('course');
  const [bearing, setBearing] = useState(0);
  const [completeOrderPrice, setCompleteOrderPrice] = useState(0);

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
  const mountedRef = useRef(true);
  const abortRef = useRef(null);

  const lastLLRef = useRef(null);
  const headingRef = useRef(null);

  const lastFetchAtRef = useRef(0);
  const lastLegRef = useRef({from: null, to: null});
  const offRouteSinceRef = useRef(null);

  const lastOnRoutePointRef = useRef(null);

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
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      appStateRef.current = s;
    });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  const resetBackCounter = () => {
    if (backResetTimerRef.current) clearTimeout(backResetTimerRef.current);
    backResetTimerRef.current = null;
    backPressCountRef.current = 0;
  };
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== 'android') return undefined;
      const onBackPress = () => {
        backPressCountRef.current += 1;
        const remaining = 2 - backPressCountRef.current;
        if (remaining > 0) {
          ToastAndroid.show(
            remaining === 1 && t?.('pressBackOneMoreTimeToExit'),
            ToastAndroid.SHORT,
          );
          if (backResetTimerRef.current)
            clearTimeout(backResetTimerRef.current);
          backResetTimerRef.current = setTimeout(resetBackCounter, 4000);
          return true;
        }
        BackHandler.exitApp();
        return true;
      };
      const sub = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => {
        sub?.remove?.();
        resetBackCounter();
      };
    }, [t]),
  );

  useEffect(() => {
    dispatch(setSocketStatus(socketConnected));
  }, [socketConnected]);

  /* ───────── Sockets ───────── */
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
        setCurrentOrderIndex(null);
        setShowAcceptOrder(false);
        const orders = [payload?.message].filter(Boolean);
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
            data: {delivery_id: String(payload?.message?.id ?? '')},
          });
        }
      } else if (event === 'delivery_accepted_by_rider') {
        if (selectedOrderRef.current != null) return;
        const removedId = payload?.message?.id;
        removeOrderById(removedId);
        showToastWarning(
          `${t('deliveryId')} ${payload?.message?.id} ${t('acceptByAnother')}`,
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
      try {
        await sendData(urls.SETFCMTOKEN, {fcm_token: token});
      } catch {}
      messaging().onTokenRefresh(async newToken => {
        try {
          await sendData(urls.SETFCMTOKEN, {fcm_token: newToken});
        } catch {}
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
      if (Platform.OS === 'android' && notifOk)
        await createNotifChannelOnce(channelIdRef);
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
              const lng = round5(longitude),
                lat = round5(latitude);
              if (lng != null && lat != null) setCamera([lng, lat]);
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
            const lng = round5(longitude),
              lat = round5(latitude);
            if (lng != null && lat != null) setCamera([lng, lat]);
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

  const changeStatusOrderAccept = async (order, status, pin, valueResoan) => {
    status !== 'cancel' && setLoadingChangeStatus(true);
    const response = await sendData(urls.CHANGESTATUSORDER, {
      vehicle_id: config?.selectVehicle?.id,
      delivery_id: order?.id,
      status,
      secure_pin: pin ? pin : null,
      rider_arrive_to_pickup_calculated_time:
        status == 'accepted'
          ? isoWithOffsetPlusMinutes(pickUpTimeUpdate)
          : null,
      description: valueResoan ? valueResoan : null,
    });

    if (response?.data?.status) {
      setSelectedOrder(response?.data?.data);
      if (status === 'accepted') {
        setIsAccepted(true);
        setShowAcceptOrder(false);
        setCurrentOrderIndex(null);
        setIsNavOn(true);
        setIsFollowing(true);
        setFollowMode('course');
      }
      if (
        [
          'completed',
          'cancel',
          'request_new_driver',
          'shipment_destroyed',
          'address_not_found',
        ].includes(status)
      ) {
        status === 'completed' && setCompleteOrderPrice(order?.rider_fee || 0);
        resetRoute();
        setSelectedOrder(null);
        setIsNavOn(false);
        setIsFollowing(false);
        status !== 'completed' && showToast(t('cancelOrder'));
        status === 'completed' && setConfirmCompleteModalVisible(true);
      }
    } else {
      errorHandler(response);
      return;
    }
    status !== 'cancel' && setLoadingChangeStatus(false);
  };

  const currentOrder =
    currentOrderIndex !== null ? data[currentOrderIndex] : null;

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
    setBanner({primary: '', distance: 0});
    setTraveledFeature(null);
    setRemainingFeature(null);
    progressIdxRef.current = 0;
    lastOnRoutePointRef.current = null;
    if (abortRef.current) abortRef.current.abort();
  };
  const buildLineFeature = coords =>
    coords && coords.length >= 2
      ? {type: 'Feature', geometry: {type: 'LineString', coordinates: coords}}
      : null;

  const fetchRoute = useCallback(
    async (from, to) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        showToast('Fetch route....');
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

        const res = await fetch(url, {signal: controller.signal});
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const route = json?.routes?.[0];
        const geom = route?.geometry;
        const steps = route?.legs?.[0]?.steps || [];
        const duration = route?.duration || 0;
        const distance = route?.distance || 0;

        if (geom && !controller.signal.aborted) {
          const coords = (geom.coordinates || [])
            .map(c => normalizeCoord(c))
            .filter(Boolean);

          setRouteCoords(coords);
          setRouteSteps(steps);
          setRouteDurationSec(duration);
          setRouteDistanceM(distance);
          setBanner({primary: '', distance: 0});
          progressIdxRef.current = 0;

          const userLL =
            userLocRef.current || normalizeCoord(cameraRef.current);
          if (userLL) {
            const {idx, point} = closestOnPolyline(userLL, coords);
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
      const newLeg = {from, to};
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
  }, [
    hasLocPerm,
    isAccepted,
    isFollowing,
    selectedOrder?.id,
    senderCoordinate,
    guardedFetchRoute,
  ]);

  useEffect(() => {
    lastLegRef.current = {from: null, to: null};
    lastFetchAtRef.current = 0;
  }, [selectedOrder?.id, senderCoordinate?.[0], senderCoordinate?.[1]]);

  /* ───────── Live progress + banner ───────── */
  const updateBannerAndSteps = useCallback(
    userLL => {
      if (!routeSteps.length) return;
      const idx = Math.min(progressIdxRef.current, routeSteps.length - 1);
      const currentStep = routeSteps[idx];
      const nextLoc = currentStep?.maneuver?.location;
      const nextPt =
        Array.isArray(nextLoc) && nextLoc.length === 2
          ? normalizeCoord(nextLoc)
          : null;
      if (!nextPt) return;
      const d = Math.max(0, Math.round(haversineMeters(userLL, nextPt)));
      if (d < 30 && idx < routeSteps.length - 1)
        progressIdxRef.current = idx + 1;
      setBanner({primary: stepPrimaryText(currentStep), distance: d});
    },
    [routeSteps],
  );

  const updateRouteProgress = useCallback(
    userLL => {
      if (!routeCoords || routeCoords.length < 2) return;
      const {idx, point} = closestOnPolyline(userLL, routeCoords);
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

  /* ───────── USER LOCATION updates ───────── */
  const onUserLocation = useCallback(
    async location => {
      if (!location?.coords) return;
      const {latitude, longitude, heading, course} = location.coords;
      const userLL = [round5(longitude), round5(latitude)];
      if (userLL[0] == null || userLL[1] == null) return;

      setUserCoordState(userLL);

      let hdg = toNum(heading);
      if (hdg == null || !Number.isFinite(hdg)) hdg = toNum(course);
      if ((hdg == null || hdg === 0) && lastLLRef.current) {
        const dist = haversineMeters(lastLLRef.current, userLL);
        if (dist > 1) hdg = bearingAB(lastLLRef.current, userLL);
      }
      if (hdg != null && Number.isFinite(hdg)) {
        const smoothed = smoothHeading(
          headingRef.current ?? normDeg(hdg),
          normDeg(hdg),
        );
        headingRef.current = smoothed;
        setUserHeadingDeg(smoothed);
        if (!isFollowing) setBearing(smoothed);
      }
      lastLLRef.current = userLL;
      userLocRef.current = userLL;

      const last = cameraRef.current;
      const movedEnough =
        !last ||
        Math.abs(userLL[0] - last[0]) > 0.0005 ||
        Math.abs(userLL[1] - last[1]) > 0.0005;
      if (!isFollowing && movedEnough) setCamera(userLL);

      if (isFollowing && routeCoords.length > 1) {
        updateRouteProgress(userLL);
        updateBannerAndSteps(userLL);
      }

      try {
        if (isAccepted && senderCoordinate && routeCoords?.length >= 2) {
          if (!lastOnRoutePointRef.current) {
            const {point} = closestOnPolyline(userLL, routeCoords);
            lastOnRoutePointRef.current = point;
          }
          const dFromAnchor = haversineMeters(
            userLL,
            lastOnRoutePointRef.current,
          );
          if (dFromAnchor > OFFROUTE_JUMP_M) {
            await fetchRoute(userLL, senderCoordinate);
            lastFetchAtRef.current = Date.now();
            lastLegRef.current = {from: userLL, to: senderCoordinate};
          }
        }
      } catch {}
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
      const userLL = userLocRef.current;
      if (!userLL) return;
      if (appStateRef.current !== 'active') return;

      let d = Infinity;
      const anchor = lastOnRoutePointRef.current;
      if (anchor) {
        d = haversineMeters(userLL, anchor);
      } else if (remainingFeature?.geometry?.coordinates?.length >= 2) {
        const {point} = closestOnPolyline(
          userLL,
          remainingFeature.geometry.coordinates,
        );
        d = haversineMeters(userLL, point);
      } else if (routeCoords?.length >= 2) {
        const {point} = closestOnPolyline(userLL, routeCoords);
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
            lastLegRef.current = {from: null, to: null};
            guardedFetchRoute(userLL, to);
          }
          offRouteSinceRef.current = null;
        }
      } else {
        offRouteSinceRef.current = null;
      }
    }, 2000);
    return () => clearInterval(id);
  }, [
    routeSteps,
    remainingFeature?.geometry,
    routeCoords,
    senderCoordinate,
    guardedFetchRoute,
  ]);

  /* ───────── Background location post (SEND TO API) ───────── */
  const locationInFlightRef = useRef(false);

  const postLocation = useCallback(async () => {
    if (!config?.selectVehicle?.id) return;
    if (locationInFlightRef.current) return;

    // ✅ Use real GPS location; fallback to camera if GPS not ready yet
    const loc = userLocRef.current || cameraRef.current;
    const norm = normalizeCoord(loc);
    if (!norm) return;

    const dir =
      headingRef.current != null ? Math.round(headingRef.current) : null;

    locationInFlightRef.current = true;
    try {
      await sendData(urls.UPDATELOCATION, {
        longitude: norm[0],
        latitude: norm[1],
        heading: dir,
        vehicle_id: config?.selectVehicle?.id,
      });
    } catch (e) {
      // optional: console.log('UPDATELOCATION error', e);
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

  /* ───────── Center-on-me FAB ───────── */
  const getOneShotGPS = () =>
    new Promise(resolve => {
      Geolocation.getCurrentPosition(
        pos => {
          const {latitude, longitude} = pos.coords || {};
          resolve(
            latitude != null && longitude != null
              ? [round5(longitude), round5(latitude)]
              : null,
          );
        },
        () => resolve(null),
        {enableHighAccuracy: true, timeout: 5000, maximumAge: 0},
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
          lastLegRef.current = {from: null, to: null};
          const from = normalizeCoord(target);
          if (from) await guardedFetchRoute(from, to);
        }
      }, 280);
    });
  }, [
    mapReady,
    isAccepted,
    senderCoordinate,
    guardedFetchRoute,
    userCoordState,
  ]);

  const userCoordMemo = useMemo(
    () => normalizeCoord(camera) ?? camera,
    [camera],
  );

    const getWallet = async () => {
        const response = await getData(urls.GETWALLET);
        if (response?.data?.status) {
          dispatch(setUserWallet(response?.data?.data))
        } else {
          errorHandler(response);
        }
  };

    const getVehicle = async () => {
    const response = await getData(`${urls.GETVEHICLE}?page=1`);
    if (response?.data?.status) {
      dispatch(setVehicleData(response?.data?.data?.items));
    } else {
      errorHandler(response);
    }
  };


   useFocusEffect(
      useCallback(() => {
        getWallet();
        getVehicle();
      }, []),
    );


  const updateVehicleStatus = async () => {
    const response = await sendData(urls.UPDATESTATUSVEHICLE, {
      id: config?.selectVehicle?.id,
      on_status: config?.selectVehicle?.on_status == 'on' ? 'off' : 'on',
    });
    if (response?.data?.status) {
      getVehicleStatus();
    } else {
      errorHandler(response);
    }
  };

  const getVehicleStatus = async () => {
    const response = await getData(
      `${urls.GETVEHICLEDETAIL}?id=${config?.selectVehicle?.id}`,
    );
    if (response?.data?.status) {
      dispatch(setSelectVehicle(response?.data?.data));
    } else {
      errorHandler(response);
    }
  };

  useEffect(() => {
    if (config?.selectVehicle) {
      getVehicleStatus();
    }
  }, []);

  /* ───────── Render ───────── */
  return (
    <>
      <View
        style={[styles.container, isAndroid15Plus && {marginBottom: hp(6)}]}>
        <CustomHeader onRefreshPress={onPressMyLocation} />

        <View style={styles.mapWrap}>
          {hasLocPerm ? (
            <>
              <Mapbox.MapView
                key={mapMountKey}
                styleURL={Mapbox.StyleURL.Light}
                zoomEnabled
                rotateEnabled
                style={styles.map}
                onDidFinishLoadingMap={() => setMapReady(true)}>
                {/* Remaining route (black) */}
                {remainingFeature && (
                  <Mapbox.ShapeSource
                    id="remainingSource"
                    shape={remainingFeature}>
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

                {/* Traveled route (yellow) */}
                {traveledFeature && (
                  <Mapbox.ShapeSource
                    id="traveledSource"
                    shape={traveledFeature}>
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

                {/* Destination pin */}
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
                        style={{
                          width: wp(8),
                          height: hp(8),
                        }}
                      />
                    ) : (
                      <Image
                        source={require('../../../../assets/image/car.png')}
                        style={{
                          width: wp(8),
                          height: hp(8),
                        }}
                      />
                    )}
                  </Mapbox.MarkerView>
                )}
              </Mapbox.MapView>
              
            </>
          ) : (
            <View style={styles.map} />
          )}

          {/* Step banner */}
          <View style={styles.overlay} pointerEvents="box-none">
            {banner?.primary ? (
              <View style={styles.banner} pointerEvents="none">
                <CustomText style={styles.bannerTitle}>
                  {banner.primary}
                </CustomText>
                {!!banner.distance && (
                  <CustomText style={styles.bannerSub}>
                    {banner.distance} m
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
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={getDeliveryLists}
          style={styles.button1}>
          <Update width={wp(5)} height={wp(5)} />
        </TouchableOpacity>
        {!selectedOrder && (
          <CustomAvailableRider
            onAvailabilityChange={updateVehicleStatus}
            toggleValue={config?.selectVehicle?.on_status == 'on'}
          />
        )}


        {/* Tinder-style Accept stack */}
        {!isAccepted && showAcceptOrder && data.length > 0 && (
          <View style={styles.tinderWrap} pointerEvents="box-none">
            <TinderCarousel
              key={`deck-${data[0]?.id ?? 'x'}-${data.length}`}
              data={data}
              renderItem={({item}) => (
                <AcceptOrderModal
                  order={item}
                  userCoord={userCoordMemo}
                  onAccept={() => handleAcceptOrder(item)}
                  pickUpTime={mins => pickUpTimesRef.current.set(item.id, mins)}
                />
              )}
              cardWidth={wp(100)}
              cardHeight={hp(31.2)}
              stackCount={Math.min(4, data.length)}
              stackScale={0.94}
              stackOffset={14}
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

      {/* Active order modal */}
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

      {/* Cancel reasons modal */}
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
        onSelectReason={(reasonKey, text) => {
          dispatch(setSelectVehicleVisible(!config?.selectVehicleVisible));
        }}
        onClose={() =>
          dispatch(setSelectVehicleVisible(!config?.selectVehicleVisible))
        }
      />

      {/* Confirm modal */}
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

      {/* Cancel delivery confirmation */}
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
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  text: {fontWeight: 'bold', color: colors.white, fontSize: wp(7)},
  mapWrap: {flex: 1, width: wp(100), position: 'relative'},
  map: {flex: 1, width: wp(100)},
  overlay: {
    position: 'absolute',
    top: hp(11),
    left: wp(2.3),
    right: wp(2.3),
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: hp(10),
    zIndex: 10,
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
  bannerTitle: {
    color: colors.neutral900,
    fontSize: wp(4),
  },
  bannerSub: {
    color: colors.neutral900,
    fontSize: wp(4.5),
    fontFamily: 'YaldeviJaffna-Bold',
  },
  fab: {
    position: 'absolute',
    right: wp(5),
    bottom: hp(45),
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tinderWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
});
