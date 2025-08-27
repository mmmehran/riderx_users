import React, {useState, useRef} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';
import {ArrowDown} from '../../../assets/svg/index';
import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import ReportList from '../../components/list/ReportList';

const Report = props => {
  const navigation = useNavigation();
  const {t} = useTranslation();

  const data = [
    {
      id: 1,
      price: 15.45,
      service: 'Delivery',
      time: '10:00 AM',
      duration: '30 min',
      distance: '5 km',
      address1: '123 Main St, City, Country',
      address2: '456 Elm St, City, Country',
    },
    {
      id: 2,
      price: 15.45,
      service: 'Delivery',
      time: '10:00 AM',
      duration: '30 min',
      distance: '5 km',
      address1: '123 Main St, City, Country',
      address2: '456 Elm St, City, Country',
    },
    {
      id: 3,
      price: 15.45,
      service: 'Delivery',
      time: '10:00 AM',
      duration: '30 min',
      distance: '5 km',
      address1: '123 Main St, City, Country',
      address2: '456 Elm St, City, Country',
    },
  ];
  return (
    <CustomScreen>
      <CustomHeaderApp title={t('report')}></CustomHeaderApp>
      <View style={styles.sortContainer}>
        <TouchableOpacity style={styles.sort}>
          <CustomText style={styles.textsort}>{t('type')}</CustomText>
          <View style={styles.arrowContainer}>
            <ArrowDown width={wp(4)} height={wp(4)} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sort, {width: wp(30)}]}>
          <CustomText style={styles.textsort}>{t('all')}</CustomText>
          <View style={styles.arrowContainer}>
            <ArrowDown width={wp(4)} height={wp(4)} />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sort, {width: wp(30)}]}>
          <CustomText style={styles.textsort}>{t('clearAll')}</CustomText>
        </TouchableOpacity>
      </View>
      <View style={styles.listContainer}>
        <ReportList data={data}></ReportList>
      </View>
    </CustomScreen>
  );
};

export default Report;

const styles = StyleSheet.create({
  sortContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: wp(6),
  },
  sort: {
    height: hp(4),
    backgroundColor: 'rgba(217, 217, 217, 0.5)',
    borderRadius: wp(50),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: wp(4),
  },
  textButton: {
    fontSize: wp(3.8),
    color: colors.black,
    fontWeight: '900',
  },
  textsort: {
    color: 'rgba(55, 55, 55, 0.8)',
    fontWeight: 'bold',
    marginRight: wp(2),
  },
  arrowContainer: {
    marginTop: hp(0.5),
  },
  listContainer: {
    marginTop: hp(2),
  },
});
