import React, {useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/core';

import CustomScreen from '../../../components/common/CustomScreen';
import CustomText from '../../../components/common/CustomText';
import colors from '../../../config/colors';
import {
  InfoIcon,
  ScoterIcon,
  VanIcon,
  MotorIcon1,
  CarIcon1,
} from '../../../../assets/svg/index';
import {getData, sendData} from '../../../services/common.service';
import urls from '../../../services/urls.json';
import errorHandler from '../../../utils/errorHandler';
import {
  setSelectVehicle,
  selectConfig,
  setVehicleData,
} from '../../../redux/reducers/configReducer';

const ChooseVehicle = props => {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const dispatch = useDispatch();
  const config = useSelector(selectConfig);

  const getVehicle = async () => {
    setLoading(true);
    const response = await getData(`${urls.GETVEHICLE}?page=1`);
    if (response?.data?.status) {
      setData(response?.data?.data);
      dispatch(setVehicleData(response?.data?.data?.items));
    } else {
      errorHandler(response);
    }
    setLoading(false);
  };

  const getVehicleStatus = async value => {
    const response = await getData(`${urls.GETVEHICLEDETAIL}?id=${value}`);
    if (response?.data?.status) {
      dispatch(setSelectVehicle(response?.data?.data));
    } else {
      errorHandler(response);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getVehicle();
    }, []),
  );

  const updateVehicleStatus = async value => {
    const response = await sendData(urls.UPDATESTATUSVEHICLE, {
      id: config?.selectVehicle?.id,
      on_status: 'off',
    });
    if (response?.data?.status) {
      getVehicleStatus(value?.id);
    } else {
      errorHandler(response);
    }
  };

  return (
    <CustomScreen>
      <View style={styles.container}>
        <View style={styles.rowHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <InfoIcon width={wp(6.5)} height={wp(6.5)}></InfoIcon>
          </TouchableOpacity>
          <CustomText style={styles.title}>{t('selectYourVehivle')}</CustomText>
        </View>
        <View style={styles.line}> </View>
        {loading ? (
          <View style={{marginTop: hp(3)}}>
            <ActivityIndicator size={'large'} color={colors.yellowLight} />
          </View>
        ) : (
          <>
            <View style={styles.lisContainer}>
              {data?.items.map(item => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.reasonButton}
                  onPress={() => {
                    if (config?.selectVehicle?.id) {
                      updateVehicleStatus(item);
                    } else {
                      dispatch(setSelectVehicle(item));
                    }
                  }}>
                  <View style={styles.row1}>
                    <View style={[styles.checkContainer]}>
                      {config?.selectVehicle?.id === item?.id && (
                        <View style={styles.pin}></View>
                      )}
                    </View>
                    <CustomText style={styles.reasonText}>
                      {item?.vehicle_brand
                        ? ` ${item?.vehicle_brand?.title} ${item?.vehicle_model?.title} ${item?.vehicle_model?.model_type}`
                        : `${
                            (item?.vehicle_type ?? '').charAt(0).toUpperCase() +
                            (item?.vehicle_type ?? '').slice(1)
                          }`}
                    </CustomText>
                  </View>
                  {(item?.vehicle_type == 'van_1t' ||
                    item?.vehicle_type == 'van_2t' ||
                    item?.vehicle_type == 'van_3.5t') && (
                    <VanIcon width={wp(30)} height={wp(30)}></VanIcon>
                  )}
                  {(item?.vehicle_type == 'motorcycle' ||
                    item?.vehicle_type == 'bicycle' ||
                    item?.vehicle_type == 'e_bicycle') && (
                    <MotorIcon1 width={wp(30)} height={wp(30)}></MotorIcon1>
                  )}
                  {item?.vehicle_type == 'car' && (
                    <CarIcon1 width={wp(30)} height={wp(30)}></CarIcon1>
                  )}
                  {item?.vehicle_type == 'moped' && (
                    <ScoterIcon width={wp(30)} height={wp(30)}></ScoterIcon>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.closeButton]}
            onPress={() => navigation.goBack()}>
            <CustomText style={styles.closeText}>{t('submit')}</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </CustomScreen>
  );
};

export default ChooseVehicle;

const styles = StyleSheet.create({
  iconContainer: {
    marginLeft: wp(10),
    marginTop: hp(4),
  },
  top: {
    width: wp(90),
    height: hp(8),
    backgroundColor: colors.yellowLight,
    marginHorizontal: wp(5),
    marginTop: hp(3),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  textTop: {
    fontSize: wp(7),
    fontWeight: 'bold',
  },
  container: {
    width: wp(100),
    backgroundColor: colors.white,
    borderTopLeftRadius: wp(3),
    borderTopRightRadius: wp(3),
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    flex: 1,
  },
  row1: {
    flexDirection: 'row',
  },
  buttonContainer: {
    marginBottom: hp(2),
    marginTop: hp(0.5),
    flex: 1,
    justifyContent: 'flex-end',
  },
  line: {
    backgroundColor: colors.neutral200,
    width: wp(92),
    height: wp(0.3),
    marginTop: hp(2),
  },
  checkContainer: {
    width: wp(5.5),
    height: wp(5.5),
    borderRadius: wp(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: wp(0.3),
    borderColor: colors.neutral700,
    marginRight: wp(3),
    marginLeft: wp(2),
  },
  pin: {
    width: wp(3.5),
    height: wp(3.5),
    backgroundColor: colors.neutral900,
    borderRadius: wp(20),
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(0.5),
  },
  modal: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  title: {
    fontSize: wp(4.5),
    fontFamily: 'YaldeviJaffna-Bold',
    color: colors.neutral900,
    marginLeft: wp(1.5),
  },
  content: {
    fontSize: wp(4),
    color: colors.neutral600,
    marginLeft: wp(1.5),
    lineHeight: hp(2.8),
    marginBottom: hp(2),
  },
  reasonButton: {
    width: '100%',
    height: hp(11),
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(3),
    borderRadius: wp(3),
    borderWidth: wp(0.3),
    borderColor: colors.neutral100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hp(2),
  },
  reasonText: {
    fontSize: wp(4),
    color: colors.neutral800,
  },
  closeButton: {
    marginTop: hp(2),
    borderRadius: wp(2.3),
    backgroundColor: colors.black,
    width: wp(92),
    height: hp(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: wp(4),
    color: colors.white,
    fontFamily: 'YaldeviJaffna-Bold',
  },
});
