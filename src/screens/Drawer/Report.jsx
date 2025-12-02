import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/core';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';
import {ArrowDown} from '../../../assets/svg/index';
import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import ReportList from '../../components/list/ReportList';
import {getData} from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';

const buildUrl = (base, paramsObj = {}) => {
  const parts = [];
  Object.keys(paramsObj).forEach(k => {
    const v = paramsObj[k];
    if (v !== null && v !== undefined && v !== '') {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  });
  const sep = base.includes('?') ? '&' : '?';
  return parts.length ? `${base}${sep}${parts.join('&')}` : base;
};

const Report = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  const [status, setStatus] = useState(null);

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const STATUS_OPTIONS = [
    {label: t('all'), value: null},
    {label: t('accept'), value: 'accepted'},
    {label: t('pickup'), value: 'pickup'},
    {label: t('shipmentDestroyed'), value: 'shipment_destroyed'},
    {label: t('addressNotFound'), value: 'address_not_found'},
    {label: t('Completed'), value: 'completed'},
    {label: t('Canceled'), value: 'cancel'},
  ];

  const selectedVehicleLabel = (() => {
    if (vehicleId == null) return t('all');
    const v = vehicles.find(v => String(v?.id) === String(vehicleId));
    if (!v) return `#${vehicleId}`;

    return v?.vehicle_brand
      ? ` ${v?.vehicle_brand?.title} ${v?.vehicle_model?.title} ${v?.vehicle_model?.model_type}`
      : `${(v?.vehicle_type ?? '').charAt(0).toUpperCase()}${(
          v?.vehicle_type ?? ''
        ).slice(1)}`;
  })();

  const selectedStatusLabel = (() => {
    const s = STATUS_OPTIONS.find(s => s.value === status);
    return s?.label || t('type');
  })();

  const getVehicle = async () => {
    const res = await getData(buildUrl(`${urls.GETVEHICLE}`, {page: 1}));
    if (res?.data?.status) {
      const data = res?.data?.data;
      const list = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      setVehicles(list);
    } else {
      errorHandler(res);
    }
  };

  const fetchPage = async (pageToLoad = 1, mode = 'replace') => {
    const url = buildUrl(`${urls.GETRIDERHISTORY}`, {
      page: pageToLoad,
      vehicle_id: vehicleId,
      status,
    });

    try {
      if (mode === 'replace') setRefreshing(true);
      else setLoadingMore(true);
      if (pageToLoad === 1 && mode === 'replace') setLoadingInitial(true);
      const res = await getData(url);
      if (res?.data?.status) {
        const payload = res.data.data || {};
        const newItems = Array.isArray(payload.items) ? payload.items : [];
        setHasNext(!!payload.has_next);
        setPage(payload.current_page || pageToLoad);
        setItems(prev =>
          mode === 'append' ? [...prev, ...newItems] : newItems,
        );
      } else {
        errorHandler(res);
      }
    } finally {
      setLoadingInitial(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getVehicle();
      fetchPage(1, 'replace');
    }, []),
  );

  useEffect(() => {
    fetchPage(1, 'replace');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, status]);

  const onRefresh = () => fetchPage(1, 'replace');

  const onEndReached = () => {
    if (!hasNext || loadingMore || refreshing || loadingInitial) return;
    fetchPage(page + 1, 'append');
  };

  const onSelectStatus = val => {
    setStatus(val);
    setShowStatusModal(false);
  };

  const onSelectVehicle = id => {
    setVehicleId(id);
    setShowVehicleModal(false);
  };

  const clearAll = () => {
    setVehicleId(null);
    setStatus(null);
  };

  const Footer = () =>
    loadingMore ? (
      <View style={{paddingVertical: hp(2)}}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    ) : null;


  return (
    <CustomScreen>
      <CustomHeaderApp title={t('tripHistory')} />
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sort, {width: wp(33)}]}
          onPress={() => setShowStatusModal(true)}>
          <CustomText
            numberOfLines={1}
            style={[styles.textsort, {width: wp(20)}]}>
            {selectedStatusLabel}
          </CustomText>
          <View style={styles.arrowContainer}>
            <ArrowDown width={wp(3)} height={wp(3)} />
          </View>
        </TouchableOpacity>
        <View style={styles.line}></View>
        <TouchableOpacity
          style={[styles.sort, {width: wp(36)}]}
          onPress={() => setShowVehicleModal(true)}>
          <CustomText
            numberOfLines={1}
            style={[styles.textsort, {width: wp(23)}]}>
            {selectedVehicleLabel}
          </CustomText>
          <View style={styles.arrowContainer}>
            <ArrowDown width={wp(3)} height={wp(3)} />
          </View>
        </TouchableOpacity>
                <View style={styles.line}></View>
        <TouchableOpacity style={[styles.sort]} onPress={clearAll}>
          <CustomText style={styles.textsort}>{t('clearAll')}</CustomText>
        </TouchableOpacity>
      </View>
      <View style={styles.listContainer}>
        {items?.length ? (
          <ReportList
            data={items}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={onEndReached}
            ListFooterComponent={<Footer />}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <CustomText>No data found.</CustomText>
          </View>
        )}
      </View>
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setShowStatusModal(false)}
        />
        <View style={styles.sheet}>
          <CustomText style={styles.sheetTitle}>{t('type')}</CustomText>
          <FlatList
            data={STATUS_OPTIONS}
            keyExtractor={(it, idx) => String(it.value ?? `all-${idx}`)}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => onSelectStatus(item.value)}>
                <CustomText style={styles.optionText}>{item.label}</CustomText>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
      <Modal
        visible={showVehicleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVehicleModal(false)}>
        <Pressable
          style={styles.backdrop}
          onPress={() => setShowVehicleModal(false)}
        />
        <View style={styles.sheet}>
          <CustomText style={styles.sheetTitle}>{t('vehicle')}</CustomText>
          <FlatList
            data={[
              {id: null, _label: t('all')},
              ...vehicles.map(v => ({
                ...v,
                _label: v?.vehicle_brand
                  ? ` ${v?.vehicle_brand?.title} ${v?.vehicle_model?.title} ${v?.vehicle_model?.model_type}`
                  : `${(v?.vehicle_type ?? '').charAt(0).toUpperCase()}${(
                      v?.vehicle_type ?? ''
                    ).slice(1)}`,
              })),
            ]}
            keyExtractor={(it, idx) => String(it.id ?? `all-${idx}`)}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => onSelectVehicle(item.id)}>
                <CustomText style={styles.optionText}>{item._label}</CustomText>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </CustomScreen>
  );
};

export default Report;

const styles = StyleSheet.create({
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp(5),
    borderColor:colors.neutral100,
    borderWidth:wp(0.3),
    borderRadius:wp(2),
    marginTop:hp(2)
  },
  noDataContainer: {
    alignItems: 'center',
    marginTop: hp(2),
  },
  line:{
    width:wp(0.3),
    height:hp(4),
    backgroundColor:colors.neutral100
  },
  sort: {
    height: hp(4),
    backgroundColor: 'transparent',
    borderRadius: wp(50),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: wp(2),
  },
  textsort: {
    color: colors.neutral900,
    fontFamily: 'YaldeviJaffna-Bold',
    fontSize:wp(3.8)
  },
  arrowContainer: {marginTop: hp(0.5)},
  listContainer: {marginTop: hp(0)},

  backdrop: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: hp(60),
    backgroundColor: '#fff',
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(3),
  },
  sheetTitle: {fontWeight: 'bold', fontSize: wp(4.2), marginBottom: hp(1.5)},
  optionRow: {
    paddingVertical: hp(1.6),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  optionText: {fontSize: wp(4)},
});
