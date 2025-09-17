/* HomeMainScreen.js */
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
import axios from 'axios';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

import notifee, {
  AndroidImportance,
  AuthorizationStatus,
} from '@notifee/react-native';

import Geolocation from '@react-native-community/geolocation';

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
  parseSocketUrl,
  isAndroid15Plus,
} from '../../../utils/helpers';
import {
  setUserProfile,
  authenticated,
} from '../../../redux/reducers/authenticationReducer';
import {connectSocket, on} from '../../../services/socket';
import {selectConfig} from '../../../redux/reducers/configReducer';
import ConfirmModal from '../../../modal/ConfirmModal';
import ConfirmCancelDeliveryModal from '../../../modal/ConfirmCancelDeliveryModal';
import routes from '../../../navigation/routes';
import colors from '../../../config/colors';
import {playDing} from '../../../utils/sounds';

const LOCATION_UPDATE_MS = 30 * 1000;
const POLL_MS = 2 * 60 * 1000;

/* ──────────────────────────────────────────────────────────────────────────
   Notifications Permission (Android + iOS)
   ────────────────────────────────────────────────────────────────────────── */
const requestNotifPermission = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true; // < Android 13
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
    } catch (e) {
      console.log('POST_NOTIFICATIONS request error:', e?.message);
      return false;
    }
  }

  // iOS via Notifee
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
  } catch (e) {
    console.log('iOS notifications permission error:', e?.message);
    return false;
  }
};

const createNotifChannelOnce = async ref => {
  if (Platform.OS !== 'android') return null; // channels are Android-only
  if (ref.current) return ref.current;
  try {
    ref.current = await notifee.createChannel({
      id: 'orders',
      name: 'Orders & Alerts',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
  } catch {
    ref.current = 'orders';
  }
  return ref.current;
};

const HomeMainScreen = () => {
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
  const [route, setRoute] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [securePinShow, setSecurePinShow] = useState(false);

  // ➕ NEW: track location permission + map remount key
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

  const locationInFlightRef = useRef(false);
  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  const channelIdRef = useRef(null);

  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      appStateRef.current = state; // 'active' | 'background' | 'inactive'
    });
    return () => sub.remove();
  }, []);

  /* ──────────────────────────────────────────────────────────────────────────
     Cross-platform notification helper
     ────────────────────────────────────────────────────────────────────────── */
  const showLocalNotification = async ({title, body, data}) => {
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
            pressAction: {id: 'default', launchActivity: 'default'},
          },
        });
      } else {
        await notifee.displayNotification({
          title,
          body,
          data,
          ios: {
            sound: 'default',
            foregroundPresentationOptions: {
              alert: true,
              sound: true,
              badge: true,
            },
          },
          pressAction: {id: 'default'},
        });
      }
    } catch (e) {
      console.log('showLocalNotification error:', e?.message);
    }
  };

  /* ──────────────────────────────────────────────────────────────────────────
     Socket setup
     ────────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const rawUrl = user?.socketio;
    const {baseUrl, roomId} = parseSocketUrl(rawUrl);
    setSocketConnected(false);

    const s = connectSocket({baseUrl, roomId});

    const offConnect = on('connect', () => {
      setSocketConnected(true);
      console.log('✅ socket connected:', s.id, 'roomId=', roomId);
    });
    const offDisconnect = on('disconnect', reason => {
      setSocketConnected(false);
      console.log('❌ socket disconnected:', reason);
    });
    const offError = on('connect_error', err => {
      setSocketConnected(false);
      console.log('⚠️ socket connect_error:', err?.message);
    });

    const anyLogger = async (event, payload) => {
      if (event == 'delivery_create_by_sender') {
        if (selectedOrderRef.current != null) return;
        const orders = [payload?.message].filter(Boolean);
        setData(orders);
        if (orders.length > 0) {
          const isActive = appStateRef.current === 'active';
          setCurrentOrderIndex(0);
          setShowAcceptOrder(true);
          setIsAccepted(false);
          if (isActive) {
            playDing();
          }

          if (!isActive) {
            await showLocalNotification({
              title: 'New delivery request',
              body: 'You have a new delivery request',
              data: {delivery_id: String(payload?.message?.id ?? '')},
            });
          }
        } else {
          setCurrentOrderIndex(null);
          setShowAcceptOrder(false);
        }
      } else if (event == 'delivery_update_status_by_sender') {
        if (selectedOrderRef.current?.id !== payload?.message?.id) return;
        if (payload?.message?.status === 'cancel') {
          setRoute(null);
          setSelectedOrder(null);
          setConfirmCancelModalVisible(!confirmCancelModalVisible);
          await showLocalNotification({
            title: 'Delivery canceled by sender',
            body: 'A delivery was cancelled',
            data: {delivery_id: String(payload?.message?.id ?? '')},
          });
        }
      }
    };
    s.onAny(anyLogger);

    return () => {
      setSocketConnected(false);
      offConnect && offConnect();
      offDisconnect && offDisconnect();
      offError && offError();
      try {
        s.offAny(anyLogger);
      } catch (e) {}
    };
  }, [user?.socketio]);

  /* ──────────────────────────────────────────────────────────────────────────
     Mapbox
     ────────────────────────────────────────────────────────────────────────── */
  Mapbox.setAccessToken(
    'pk.eyJ1IjoiYnl0ZWJyaWRnZXIiLCJhIjoiY21kZzVoNnU2MGlhcDJpcGVuNGV1amYxdyJ9.YMqlR9OovVOp-pm9yGK7eA',
  );

  /* ──────────────────────────────────────────────────────────────────────────
     Permissions + Bootstrap (SEQUENTIAL, fixes first-launch NYC)
     ────────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    let mounted = true;
    (async () => {
      // 1) LOCATION first (sets hasLocPerm and recenters immediately)
      await requestLocationPermission();

      // 2) Then NOTIFICATIONS (small delay to avoid dialog overlap)
      await new Promise(r => setTimeout(r, 200));
      const notifOk = await requestNotifPermission();

      // 3) Create Android channel (iOS doesn't use channels)
      if (Platform.OS === 'android' && notifOk) {
        await createNotifChannelOnce(channelIdRef);
      }

      // 4) Bootstrap data
      if (!mounted) return;
      getUserProfile();
      getLastDelivery();
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* ──────────────────────────────────────────────────────────────────────────
     Location permission helper (now sets hasLocPerm + remounts map)
     ────────────────────────────────────────────────────────────────────────── */
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
          // Force an initial camera recenter right away
          Geolocation.getCurrentPosition(
            pos => {
              const {latitude, longitude} = pos.coords;
              setCamera([
                Number(longitude.toFixed(5)),
                Number(latitude.toFixed(5)),
              ]);
            },
            err => {
              console.log('getCurrentPosition error:', err?.message);
            },
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 5000},
          );
          // Ensure Mapbox re-initializes its location engine after permission
          setMapMountKey(prev => prev + '-granted');
        } else {
          console.log('Android location permission denied');
        }
        return ok;
      } catch (err) {
        console.warn(err);
        setHasLocPerm(false);
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

      if (ok) {
        Geolocation.getCurrentPosition(
          pos => {
            const {latitude, longitude} = pos.coords;
            setCamera([
              Number(longitude.toFixed(5)),
              Number(latitude.toFixed(5)),
            ]);
          },
          err => {
            console.log('getCurrentPosition error:', err?.message);
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 5000},
        );
        setMapMountKey(prev => prev + '-granted');
      }
      return ok;
    } catch (e) {
      console.warn('iOS permission error:', e);
      setHasLocPerm(false);
      return false;
    }
  };

  /* ──────────────────────────────────────────────────────────────────────────
     Map / route / polling / location update (unchanged)
     ────────────────────────────────────────────────────────────────────────── */
  const centerToUserLocation = location => {
    if (!location?.coords) return;
    const {latitude, longitude} = location.coords;
    const rounded = [Number(longitude.toFixed(5)), Number(latitude.toFixed(5))];
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

  const requireVehicleOrToast = useCallback(() => {
    if (!config?.selectVehicle?.id) {
      showToast('Select a vehicle first to accept deliveries.', 'error');
      navigation.navigate(routes.CHOOSEVEHICLE);
      return false;
    }
    return true;
  }, [config?.selectVehicle?.id]);

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
        setRoute(null);
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

  const currentOrder =
    currentOrderIndex !== null ? data[currentOrderIndex] : null;

  const senderCoordinate = selectedOrder
    ? selectedOrder?.status !== 'pickup'
      ? [selectedOrder.sender_longitude, selectedOrder.sender_latitude]
      : [selectedOrder.receiver_longitude, selectedOrder.receiver_latitude]
    : null;

  const fetchRoute = async (userCoord, senderCoord) => {
    if (!userCoord || !senderCoord) return;
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userCoord[0]},${userCoord[1]};${senderCoord[0]},${senderCoord[1]}?geometries=geojson&access_token=pk.eyJ1IjoiYnl0ZWJyaWRnZXIiLCJhIjoiY21kZzVoNnU2MGlhcDJpcGVuNGV1amYxdyJ9.YMqlR9OovVOp-pm9yGK7eA`;
      const res = await axios.get(url);
      if (res.data?.routes?.length) {
        setRoute({
          type: 'Feature',
          geometry: res.data.routes[0].geometry,
        });
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  useEffect(() => {
    if (camera && senderCoordinate) {
      fetchRoute(camera, senderCoordinate);
    }
  }, [camera, senderCoordinate]);

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
    return () => clearInterval(id);
  }, [selectedOrder, showAcceptOrder]);

  const postLocation = useCallback(async () => {
    if (!config?.selectVehicle?.id) return;
    if (locationInFlightRef.current) return;
    const cam = cameraRef.current;
    if (!Array.isArray(cam) || cam.length < 2) return;

    locationInFlightRef.current = true;
    try {
      await sendData(urls.UPDATELOCATION, {
        longitude: cam[0],
        latitude: cam[1],
        vehicle_id: config?.selectVehicle?.id,
      });
    } catch (e) {
      // optionally log
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

  const userCoordMemo = useMemo(() => camera, [camera[0], camera[1]]);

  return (
    <>
      {socketConnected && <View style={styles.socketStatusContainer} />}
      <View
        style={[
          styles.container,
          isAndroid15Plus && {
            marginBottom: hp(insets.bottom * 0.11),
          },
        ]}>
        <CustomHeader
          onRefreshPress={() => {
            if (selectedOrder || showAcceptOrder) return;
            getDeliveryLists();
          }}
        />

        {/* Gate & remount MapView after location permission is granted */}
        {hasLocPerm ? (
          <Mapbox.MapView
            key={mapMountKey}
            zoomEnabled
            styleURL="mapbox://styles/mapbox/streets-v12"
            rotateEnabled
            style={styles.map}>
            {route && selectedOrder && (
              <Mapbox.ShapeSource id="routeSource" shape={route}>
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
            if (status === 'cancel' && selectedOrder?.status == 'pickup') {
              setCancelModalVisible(!cancelModalVisible);
            } else {
              if (pin) {
                setSecurePinShow(true);
              }
              setConfirmModalVisible(!confirmModalVisible);
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
          setCancelModalVisible(!cancelModalVisible);
        }}
        onClose={() => setCancelModalVisible(!cancelModalVisible)}
      />

      <ConfirmModal
        securePinShow={securePinShow}
        isVisible={confirmModalVisible}
        onCancel={() => {
          setConfirmModalVisible(!confirmModalVisible);
          setSecurePinShow(false);
        }}
        onConfirm={pin => {
          changeStatusOrderAccept(selectedOrder, currentStatus, pin);
          setConfirmModalVisible(!confirmModalVisible);
          setSecurePinShow(false);
        }}
      />
      <ConfirmCancelDeliveryModal
        isVisible={confirmCancelModalVisible}
        onCancel={() => {
          setConfirmCancelModalVisible(!confirmCancelModalVisible);
        }}
        onConfirm={() => {
          setConfirmCancelModalVisible(!confirmCancelModalVisible);
        }}
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
  map: {flex: 1, width: wp(100)},
  permBtn: {
    position: 'absolute',
    right: 12,
    bottom: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#222',
    opacity: 0.85,
  },
  permBtnTxt: {color: '#fff', fontSize: 12, fontWeight: '600'},
});
