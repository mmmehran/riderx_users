import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  AppState,
  TouchableOpacity,
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
import messaging from '@react-native-firebase/messaging';
import {useTranslation} from 'react-i18next';

import AcceptOrderModal from '../../../modal/AcceptOrderModal';
import AcceptedOrderModal from '../../../modal/AcceptedOrderModal';
import CancelModal from '../../../modal/CancelModal';

import {Marker, LocationPin, LocationPin1} from '../../../../assets/svg/index';
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
  isoWithOffsetPlusMinutes,
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

const MAPBOX_TOKEN =
  'pk.eyJ1IjoiYnl0ZWJyaWRnZXIiLCJhIjoiY21kZzVoNnU2MGlhcDJpcGVuNGV1amYxdyJ9.YMqlR9OovVOp-pm9yGK7eA';

Mapbox.setAccessToken(MAPBOX_TOKEN);

/* ──────────────────────────────────────────────────────────────────────
   Utils
   ────────────────────────────────────────────────────────────────────── */
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
  return Math.round(x * 1e5) / 1e5;
};
const normalizeCoord = coord => {
  if (!Array.isArray(coord) || coord.length < 2) return null;
  const lng = round5(coord[0]);
  const lat = round5(coord[1]);
  if (lng === null || lat === null) return null;
  return [lng, lat];
};
const haversineMeters = (a, b) => {
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

// Approximate planar conversion for small local distances
const lngLatToXY = ([lng, lat]) => {
  const x = lng * 111320 * Math.cos((lat * Math.PI) / 180);
  const y = lat * 110540;
  return [x, y];
};
const dist2 = (a, b) => {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
};
const clamp01 = t => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Find closest segment index and snapped point on polyline */
const closestOnPolyline = (ptLngLat, coords) => {
  if (!ptLngLat || !coords || coords.length < 2)
    return {idx: 0, point: coords[0]};
  const p = lngLatToXY(ptLngLat);
  let bestIdx = 0;
  let bestT = 0;
  let bestD2 = Infinity;
  let bestPoint = coords[0];

  for (let i = 0; i < coords.length - 1; i++) {
    const aLL = coords[i];
    const bLL = coords[i + 1];
    const a = lngLatToXY(aLL);
    const b = lngLatToXY(bLL);
    const ab = [b[0] - a[0], b[1] - a[1]];
    const ap = [p[0] - a[0], p[1] - a[1]];
    const ab2 = ab[0] * ab[0] + ab[1] * ab[1];
    const t = ab2 === 0 ? 0 : clamp01((ap[0] * ab[0] + ap[1] * ab[1]) / ab2);
    const proj = [a[0] + ab[0] * t, a[1] + ab[1] * t];
    const d = dist2(p, proj);
    if (d < bestD2) {
      bestD2 = d;
      bestIdx = i;
      bestT = t;
      const projLng = aLL[0] + (bLL[0] - aLL[0]) * t;
      const projLat = aLL[1] + (bLL[1] - aLL[1]) * t;
      bestPoint = [projLng, projLat];
    }
  }
  const idx = bestT >= 0.999 ? bestIdx + 1 : bestIdx;
  return {idx: Math.min(idx, coords.length - 2), point: bestPoint};
};

const stepPrimaryText = step => {
  const bannerText = step?.bannerInstructions?.[0]?.primary?.text;
  return bannerText || step?.maneuver?.instruction || '';
};
const stepManeuverLngLat = step => {
  const loc = step?.maneuver?.location;
  return Array.isArray(loc) && loc.length === 2
    ? [toNum(loc[0]), toNum(loc[1])]
    : null;
};

/* ────────────────────────────────────────────────────────────────────── */

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
  const [pickUpTimeUpdate, setPickUpTimeUpdate] = useState(null);
  const {t} = useTranslation();

  // Route & live progress
  const [routeSteps, setRouteSteps] = useState([]);
  const [routeDistanceM, setRouteDistanceM] = useState(0);
  const [routeDurationSec, setRouteDurationSec] = useState(0);
  const [banner, setBanner] = useState({primary: '', distance: 0});
  const [offRoute, setOffRoute] = useState(false);

  const [routeCoords, setRouteCoords] = useState([]); // full route as coord array
  const [remainingFeature, setRemainingFeature] = useState(null); // blue
  const [traveledFeature, setTraveledFeature] = useState(null); // gray
  const progressIdxRef = useRef(0);

  const [currentStatus, setCurrentStatus] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [securePinShow, setSecurePinShow] = useState(false);

  const [hasLocPerm, setHasLocPerm] = useState(false);
  const [mapMountKey, setMapMountKey] = useState('map-0');

  // Nav mode (Waze-like)
  const [isNavOn, setIsNavOn] = useState(false);

  // Camera / controls
  const [isFollowing, setIsFollowing] = useState(false);
  const [followMode, setFollowMode] = useState('course'); // 'course' | 'normal'
  const [bearing, setBearing] = useState(0);

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
    const sub = AppState.addEventListener('change', state => {
      appStateRef.current = state;
    });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  /* ────────────────────────────────────────────────────────────────────────
     Sockets
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

  const removeOrderById = useCallback(id => {
    if (id == null) return;
    setData(prev => prev.filter(o => o?.id !== id));
  }, []);

  /* ────────────────────────────────────────────────────────────────────────
     Notifications / FCM
     ──────────────────────────────────────────────────────────────────────── */
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
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      if (!enabled) return null;
      const token = await messaging().getToken();
      try {
        await sendData(urls.SETFCMTOKEN, {fcm_token: token});
      } catch (e) {}
      messaging().onTokenRefresh(async newToken => {
        try {
          await sendData(urls.SETFCMTOKEN, {fcm_token: newToken});
        } catch (e) {}
      });
      return token;
    } catch (e) {
      return null;
    }
  };

  /* ────────────────────────────────────────────────────────────────────────
     Bootstrap
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
     Data fetchers
     ──────────────────────────────────────────────────────────────────────── */
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
     Accept / advance
     ──────────────────────────────────────────────────────────────────────── */
  const requireVehicleOrToast = useCallback(() => {
    if (!config?.selectVehicle?.id) {
      showToast(t('firstselectVehicle'), 'error');
      navigation.navigate(routes.CHOOSEVEHICLE);
      return false;
    }
    return true;
  }, [config?.selectVehicle?.id, navigation, t]);

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
      status,
      secure_pin: pin ? pin : null,
      rider_arrive_to_pickup_calculated_time:
        status == 'accepted'
          ? isoWithOffsetPlusMinutes(pickUpTimeUpdate)
          : null,
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
        resetRoute();
        setSelectedOrder(null);
        setIsNavOn(false);
        setIsFollowing(false);
        showToast(
          status === 'completed' ? t('completeOrder') : t('cancelOrder'),
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
    setIsNavOn(true);
    setIsFollowing(true);
    setFollowMode('course');
  }, [data, currentOrderIndex, requireVehicleOrToast]);

  const currentOrder =
    currentOrderIndex !== null ? data[currentOrderIndex] : null;

  /* ────────────────────────────────────────────────────────────────────────
     Destination coordinate (sender or receiver based on status)
     ──────────────────────────────────────────────────────────────────────── */
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

  /* ────────────────────────────────────────────────────────────────────────
     Route fetching + init progress
     ──────────────────────────────────────────────────────────────────────── */
  const resetRoute = () => {
    setRouteCoords([]);
    setRouteSteps([]);
    setRouteDistanceM(0);
    setRouteDurationSec(0);
    setBanner({primary: '', distance: 0});
    setTraveledFeature(null);
    setRemainingFeature(null);
    progressIdxRef.current = 0;
    if (abortRef.current) abortRef.current.abort();
  };

  const buildLineFeature = coords =>
    coords && coords.length >= 2
      ? {type: 'Feature', geometry: {type: 'LineString', coordinates: coords}}
      : null;

  const fetchRoute = useCallback(async (from, to) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const url =
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
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

        const userLL = userLocRef.current || normalizeCoord(cameraRef.current);
        if (userLL) {
          const {idx, point} = closestOnPolyline(userLL, coords);
          progressIdxRef.current = idx;
          const traveled = coords.slice(0, idx + 1);
          traveled[traveled.length - 1] = point;
          const remaining = [point, ...coords.slice(idx + 1)];
          setTraveledFeature(buildLineFeature(traveled));
          setRemainingFeature(buildLineFeature(remaining));
        } else {
          setTraveledFeature(null);
          setRemainingFeature(buildLineFeature(coords));
        }
      }
    } catch (e) {
      // silent
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, []);

  // When we have an active order + nav, fetch route
  useEffect(() => {
    if (!hasLocPerm) return;

    if (!selectedOrder || !isAccepted || !(isNavOn || isFollowing)) {
      resetRoute();
      return;
    }

    const from = normalizeCoord(userLocRef.current || cameraRef.current);
    const to = normalizeCoord(senderCoordinate);
    if (!from || !to) return;

    fetchRoute(from, to);
  }, [
    hasLocPerm,
    isAccepted,
    isNavOn,
    isFollowing,
    selectedOrder?.id,
    senderCoordinate,
    fetchRoute,
  ]);

  /* ────────────────────────────────────────────────────────────────────────
     Live progress on user updates
     ──────────────────────────────────────────────────────────────────────── */
  const updateBannerAndSteps = useCallback(
    userLL => {
      if (!routeSteps.length) return;
      const idx = Math.min(progressIdxRef.current, routeSteps.length - 1);
      const currentStep = routeSteps[idx];
      const nextPt = stepManeuverLngLat(currentStep);
      if (!nextPt) return;
      const d = Math.max(0, Math.round(haversineMeters(userLL, nextPt)));
      if (d < 30 && idx < routeSteps.length - 1) {
        progressIdxRef.current = idx + 1;
      }
      const primary = stepPrimaryText(currentStep);
      setBanner({primary, distance: d});
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
    },
    [routeCoords],
  );

  const onUserLocation = useCallback(
    location => {
      if (!location?.coords) return;
      const {latitude, longitude} = location.coords;
      const userLL = [round5(longitude), round5(latitude)];
      if (userLL[0] == null || userLL[1] == null) return;

      userLocRef.current = userLL;

      // If not following, softly recenter on significant move
      const last = cameraRef.current;
      const movedEnough =
        !last ||
        Math.abs(userLL[0] - last[0]) > 0.0005 ||
        Math.abs(userLL[1] - last[1]) > 0.0005;

      if (!isNavOn && !isFollowing && movedEnough) {
        setCamera(userLL);
      }

      if ((isNavOn || isFollowing) && routeCoords.length > 1) {
        updateRouteProgress(userLL);
        updateBannerAndSteps(userLL);
      }
    },
    [
      isNavOn,
      isFollowing,
      routeCoords.length,
      updateRouteProgress,
      updateBannerAndSteps,
    ],
  );

  /* ────────────────────────────────────────────────────────────────────────
     Off-route & reroute
     ──────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!remainingFeature?.geometry || !routeSteps.length) return;
    const id = setInterval(() => {
      const userLL = normalizeCoord(cameraRef.current);
      if (!userLL) return;
      const idx = Math.min(progressIdxRef.current, routeSteps.length - 1);
      const nextPt = stepManeuverLngLat(routeSteps[idx]);
      if (!nextPt) return;
      const d = haversineMeters(userLL, nextPt);
      if (d > 60) setOffRoute(true);
    }, 3000);
    return () => clearInterval(id);
  }, [remainingFeature?.geometry, routeSteps]);

  useEffect(() => {
    if (!offRoute || !selectedOrder || !isAccepted || !(isNavOn || isFollowing))
      return;
    const from = normalizeCoord(cameraRef.current);
    const to = senderCoordinate;
    if (from && to) fetchRoute(from, to);
    setOffRoute(false);
  }, [
    offRoute,
    isAccepted,
    isNavOn,
    isFollowing,
    selectedOrder?.id,
    senderCoordinate,
    fetchRoute,
  ]);

  /* ────────────────────────────────────────────────────────────────────────
     Background location post (unchanged)
     ──────────────────────────────────────────────────────────────────────── */
  const locationInFlightRef = useRef(false);
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

  /* ────────────────────────────────────────────────────────────────────────
     Center on my location FAB
     ──────────────────────────────────────────────────────────────────────── */
  const onPressMyLocation = useCallback(() => {
    const target = userLocRef.current || cameraRef.current;
    if (!target) return;
    camRef.current?.setCamera({
      followUserLocation: false,
      centerCoordinate: target,
      zoomLevel: 18,
      pitch: 55,
      animationDuration: 220,
    });
    setTimeout(() => {
      setIsFollowing(true);
      setFollowMode('course');
      camRef.current?.setCamera({
        followUserLocation: true,
        followUserMode: 'course',
        followZoomLevel: 18,
        followPitch: 55,
        animationDuration: 220,
      });
    }, 230);
  }, []);

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

        <View style={styles.mapWrap}>
          {hasLocPerm ? (
            <Mapbox.MapView
              key={mapMountKey}
              styleURL="mapbox://styles/mapbox/streets-v12"
              zoomEnabled
              rotateEnabled
              style={styles.map}>
              {/* Remaining route (blue) */}
              {remainingFeature && (
                <Mapbox.ShapeSource
                  id="remainingSource"
                  shape={remainingFeature}>
                  <Mapbox.LineLayer
                    id="remainingLine"
                    style={{
                      lineColor: '#008CFF',
                      lineWidth: 14,
                      lineJoin: 'round',
                      lineCap: 'round',
                    }}
                  />
                </Mapbox.ShapeSource>
              )}

              {/* Traveled route (gray) */}
              {traveledFeature && (
                <Mapbox.ShapeSource id="traveledSource" shape={traveledFeature}>
                  <Mapbox.LineLayer
                    id="traveledLine"
                    style={{
                      lineColor: '#A0A4AA',
                      lineWidth: 10,
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

              {/* Live user location → updates progress */}
              <Mapbox.UserLocation
                visible
                showsUserHeadingIndicator
                androidRenderMode="compass"
                onUpdate={onUserLocation}
              />

              {isNavOn || isFollowing ? (
                <Mapbox.Camera
                  ref={camRef}
                  followUserLocation
                  followUserMode={followMode}
                  followZoomLevel={isNavOn ? 20 : 16}
                  followPitch={isNavOn ? 55 : 0}
                  animationMode="flyTo"
                  animationDuration={500}
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

              {/* Static marker you had (optional) */}
              <Mapbox.MarkerView coordinate={camera}></Mapbox.MarkerView>
            </Mapbox.MapView>
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

          {/* Center-on-me */}
          <TouchableOpacity onPress={onPressMyLocation} style={styles.fab}>
            <LocationPin1 width={wp(6)} height={wp(6)} />
          </TouchableOpacity>
        </View>

        {config?.selectVehicle?.on_status == 'off' && (
          <View style={styles.vehicleStatus}>
            <CustomText style={styles.text}>{t('vehicleOff')}</CustomText>
          </View>
        )}
        <CustomBottomTab />
      </View>

      {/* Accept modal */}
      {currentOrder?.status === 'created' && showAcceptOrder && !isAccepted && (
        <AcceptOrderModal
          insets={insets}
          key={currentOrder?.id ?? currentOrderIndex}
          isVisible={showAcceptOrder}
          order={currentOrder}
          onClose={handleNextOrder}
          onAccept={handleAcceptOrder}
          userCoord={userCoordMemo}
          pickUpTime={value => setPickUpTimeUpdate(value)}
        />
      )}

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
        onSelectReason={reasonKey => {
          changeStatusOrderAccept(selectedOrder, reasonKey);
          setCancelModalVisible(false);
        }}
        onClose={() => setCancelModalVisible(false)}
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
        title={t('cancelOrderContent')}
        confirmText={t('confirmText')}
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
  mapWrap: {
    flex: 1,
    width: wp(100),
    position: 'relative',
  },
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
  banner: {
    position: 'absolute',
    top: hp(2.5),
    left: wp(2.5),
    right: wp(2.5),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: wp(5),
    backgroundColor: '#ff8800ef',
  },
  bannerTitle: {color: '#fff', fontSize: wp(5), fontWeight: 'bold'},
  bannerSub: {color: '#303030ff', fontSize: wp(5), fontWeight: 'bold'},
  fab: {
    position: 'absolute',
    right: wp(5),
    bottom: hp(36),
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
