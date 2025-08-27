import React, {useState} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import CustomScreen from '../../../components/common/CustomScreen';
import CustomText from '../../../components/common/CustomText';
import colors from '../../../config/colors';
import {ArrowLeft} from '../../../../assets/svg/index';
import CustomButtonService from '../../../components/custom/CustomButtonService';

const ChooseTheService = props => {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const [servicePackage, setServicePackage] = useState(false);
  const [serviceDelivery, setServiceDelivery] = useState(false);
  const [serviceHeavyPackage, setServiceHeavyPackage] = useState(false);

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
      <CustomButtonService
        title={t('package')}
        service={servicePackage}
        setService={setServicePackage}></CustomButtonService>
      <CustomButtonService
        title={t('delivery')}
        service={serviceDelivery}
        setService={setServiceDelivery}></CustomButtonService>
      <CustomButtonService
        title={t('heavyPackage')}
        service={serviceHeavyPackage}
        setService={setServiceHeavyPackage}></CustomButtonService>
    </CustomScreen>
  );
};

export default ChooseTheService;

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
