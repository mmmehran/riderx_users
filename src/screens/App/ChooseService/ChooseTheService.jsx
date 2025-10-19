import React, {useState, useCallback} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/core';

import CustomScreen from '../../../components/common/CustomScreen';
import CustomText from '../../../components/common/CustomText';
import colors from '../../../config/colors';
import {ArrowLeft} from '../../../../assets/svg/index';
import CustomButtonService from '../../../components/custom/CustomButtonService';
import {getData, sendData} from '../../../services/common.service';
import urls from '../../../services/urls.json';
import errorHandler from '../../../utils/errorHandler';

const ChooseTheService = props => {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const [loading, setLoading] = useState(true);
  const [lastPackageData, setLastPackageData] = useState(null);
  const [servicePackage, setServicePackage] = useState(null);

  const data = [
    {
      id: 1,
      name: t('package'),
    },
    {
      id: 2,
      name: t('delivery'),
    },
  ];

  const getPackageStatus = async () => {
    const response = await getData(urls.RIDERDETAIL);
    if (response?.data?.status) {
      setLastPackageData(response?.data?.data[0]);
      response?.data?.data[0]?.delivery_to_person
        ? setServicePackage(data[1])
        : setServicePackage(data[0]);
    } else {
      errorHandler(response);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getPackageStatus();
    }, []),
  );

  const changeStatus = async value => {
    const response = await sendData(urls.UPDATEPACKAGESTATUS, {
      id: lastPackageData?.id,
      delivery_to_person: value?.name == t('delivery') ? true : false,
    });
    if (response?.data?.status) {
      setLastPackageData(response?.data?.data);
      response?.data?.data?.delivery_to_person
        ? setServicePackage(data[1])
        : setServicePackage(data[0]);
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
        <CustomText style={styles.textTop}>{t('chooseService')}</CustomText>
      </View>

      {data?.map(item => {
        return (
          <CustomButtonService
            data={item}
            service={servicePackage}
            setService={value => changeStatus(value)}></CustomButtonService>
        );
      })}
    </CustomScreen>
  );
};

export default ChooseTheService;

const styles = StyleSheet.create({
  iconContainer: {
    marginLeft: wp(10),
    marginTop: hp(4),
  },
  noService: {
    textAlign: 'center',
    marginTop: hp(3),
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
