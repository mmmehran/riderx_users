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
import {ArrowLeft} from '../../../../assets/svg/index';
import CustomButtonService from '../../../components/custom/CustomButtonService';
import {getData, sendData} from '../../../services/common.service';
import urls from '../../../services/urls.json';
import errorHandler from '../../../utils/errorHandler';
import {
  setSelectVehicle,
  selectConfig,
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
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.iconContainer}>
        <ArrowLeft />
      </TouchableOpacity>
      <View style={styles.top}>
        <CustomText style={styles.textTop}>{t('chooseVehicle')}</CustomText>
      </View>
      {loading ? (
        <View style={{marginTop: hp(3)}}>
          <ActivityIndicator size={'large'} color={colors.yellowLight} />
        </View>
      ) : (
        <>
          {data?.items?.map(item => {
            return (
              <CustomButtonService
                data={item}
                title={
                  item?.vehicle_brand
                    ? ` ${item?.vehicle_brand?.title} ${item?.vehicle_model?.title} ${item?.vehicle_model?.model_type}`
                    : `${
                        (item?.vehicle_type ?? '').charAt(0).toUpperCase() +
                        (item?.vehicle_type ?? '').slice(1)
                      }`
                }
                service={config?.selectVehicle}
                setService={value => {
                  if (config?.selectVehicle?.id) {
                    updateVehicleStatus(value);
                  } else {
                    dispatch(setSelectVehicle(value));
                  }
                }}></CustomButtonService>
            );
          })}
        </>
      )}
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
});
