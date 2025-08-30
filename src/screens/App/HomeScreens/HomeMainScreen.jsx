import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {View, StyleSheet, PermissionsAndroid, Platform} from 'react-native';
import {widthPercentageToDP as wp} from 'react-native-responsive-screen';
import Mapbox from '@rnmapbox/maps';
import axios from 'axios';
import {useDispatch, useSelector} from 'react-redux';

import AcceptOrderModal from '../../../modal/AcceptOrderModal';
import AcceptedOrderModal from '../../../modal/AcceptedOrderModal';

import {Marker, LocationPin} from '../../../../assets/svg/index';
import CustomHeader from '../../../components/custom/CustomHeader';
import CustomBottomTab from '../../../components/custom/CustomBottomTab';
import {getData, sendData} from '../../../services/common.service';
import urls from '../../../services/urls.json';
import errorHandler from '../../../utils/errorHandler';
import {showToast, parseSocketUrl} from '../../../utils/helpers';
import {
  setUserProfile,
  authenticated,
} from '../../../redux/reducers/authenticationReducer';
import {connectSocket, on} from '../../../services/socket';

const HomeMainScreen = () => {
  const [camera, setCamera] = useState([-74.006, 40.7128]); // [lng, lat]
  const [data, setData] = useState([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(null);
  const [showAcceptOrder, setShowAcceptOrder] = useState(false);
  const [loadingChangeStatus, setLoadingChangeStatus] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [route, setRoute] = useState(null);

  const dispatch = useDispatch();
  const user = useSelector(authenticated);

  const selectedOrderRef = useRef(null);
  const pollInFlightRef = useRef(false);
  const lastCamRef = useRef(null);

  const POLL_MS = 5 * 60 * 1000; // 5 minutes

  // keep ref in sync with state
  useEffect(() => {
    selectedOrderRef.current = selectedOrder;
  }, [selectedOrder]);

  useEffect(() => {
    const rawUrl = user?.socketio;
    const {baseUrl, roomId} = parseSocketUrl(rawUrl);

    const s = connectSocket({baseUrl, roomId});

    const offConnect = on('connect', () => {
      console.log('✅ socket connected:', s.id, 'roomId=', roomId);
    });
    const offDisconnect = on('disconnect', reason => {
      console.log('❌ socket disconnected:', reason);
    });
    const offError = on('connect_error', err => {
      console.log('⚠️ socket connect_error:', err?.message);
    });

    const anyLogger = (event, payload) => {
      if (selectedOrderRef.current != null) return;
      console.log(payload?.message);
      const orders = [payload?.message].filter(Boolean);
      setData(orders);
      if (orders.length > 0) {
        setCurrentOrderIndex(0);
        setShowAcceptOrder(true);
        setIsAccepted(false);
      } else {
        setCurrentOrderIndex(null);
        setShowAcceptOrder(false);
      }
    };
    s.onAny(anyLogger);

    return () => {
      offConnect && offConnect();
      offDisconnect && offDisconnect();
      offError && offError();
      try {
        s.offAny(anyLogger);
      } catch (e) {}
    };
  }, [user?.socketio]);

  Mapbox.setAccessToken(
    'sk.eyJ1IjoiYnl0ZWJyaWRnZXIiLCJhIjoiY21kbTdlOTluMWI5cjJqc2NuZHV0dzl0byJ9.xNsl53GUUBLBDrMQrFe_rQ',
  );

  useEffect(() => {
    getUserProfile();
    getLastDelivery();
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);
        if (
          granted['android.permission.ACCESS_FINE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED ||
          granted['android.permission.ACCESS_COARSE_LOCATION'] ===
            PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Location permission granted');
        } else {
          console.log('Location permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  const centerToUserLocation = location => {
    if (!location?.coords) return;
    const {latitude, longitude} = location.coords;
    const rounded = [Number(longitude.toFixed(5)), Number(latitude.toFixed(5))]; // ~1m
    const last = lastCamRef.current;
    const movedEnough =
      !last ||
      Math.abs(rounded[0] - last[0]) > 0.0005 ||
      Math.abs(rounded[1] - last[1]) > 0.0005; // ~50m

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
    const order = data[currentOrderIndex];
    if (!order) return;
    setSelectedOrder(order);
    changeStatusOrderAccept(order, 'accepted');
    setIsAccepted(true);
    setShowAcceptOrder(false);
    setCurrentOrderIndex(null);
  }, [data, currentOrderIndex]);

  const changeStatusOrderAccept = async (order, status) => {
    status !== 'cancel' && setLoadingChangeStatus(true);
    const response = await sendData(urls.CHANGESTATUSORDER, {
      vehicle_id: order?.vehicle?.id,
      delivery_id: order?.id,
      status: status,
      secure_pin: null,
    });

    if (response?.data?.status) {
      setSelectedOrder(response?.data?.data);
      if (status === 'completed' || status === 'cancel') {
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
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userCoord[0]},${userCoord[1]};${senderCoord[0]},${senderCoord[1]}?geometries=geojson&access_token=sk.eyJ1IjoiYnl0ZWJyaWRnZXIiLCJhIjoiY21kbTdlOTluMWI5cjJqc2NuZHV0dzl0byJ9.xNsl53GUUBLBDrMQrFe_rQ`;
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

  const userCoordMemo = useMemo(() => camera, [camera[0], camera[1]]);

  return (
    <>
      <View style={styles.container}>
        <CustomHeader />
        <Mapbox.MapView
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
        <CustomBottomTab />
      </View>

      {currentOrder?.status === 'created' && showAcceptOrder && !isAccepted && (
        <AcceptOrderModal
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
          changeOrder={status => changeStatusOrderAccept(selectedOrder, status)}
          order={selectedOrder}
          loading={loadingChangeStatus}
        />
      )}
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
  map: {
    flex: 1,
    width: wp(100),
  },
});
