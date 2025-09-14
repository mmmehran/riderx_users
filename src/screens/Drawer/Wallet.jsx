import React, {useCallback, useState} from 'react';
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
import {useTranslation} from 'react-i18next';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {useFocusEffect} from '@react-navigation/core';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';
import {Energy} from '../../../assets/svg/index';
import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import PaymentHistoryList from '../../components/list/PaymentHistoryList';
import {getData} from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';

const Report = props => {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [dataTransaction, setDataTransaction] = useState(null);

  const getWallet = async () => {
    setLoading(true);
    const response = await getData(urls.GETWALLET);
    if (response?.data?.status) {
      setData(response?.data?.data);
    } else {
      errorHandler(response);
    }
    const responseTransaction = await getData(urls.GETWALLETTRANSACTION);
    if (responseTransaction?.data?.status) {
      setDataTransaction(responseTransaction?.data?.data);
    } else {
      errorHandler(responseTransaction);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      getWallet();
    }, []),
  );

  return (
    <CustomScreen>
      <CustomHeaderApp title={t('wallet')}></CustomHeaderApp>
      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}>
        {loading ? (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size={'large'} color={'#000'} />
          </View>
        ) : (
          <>
            <View style={styles.balanceContainer}>
              <CustomText style={styles.textBalance}>{t('balance')}</CustomText>
              <CustomText style={styles.textPrice}>
                {data[0]?.balance} €
              </CustomText>
              <CustomText
                style={[
                  styles.textBalance,
                  {fontSize: wp(3.8), marginTop: hp(1)},
                ]}>
                {t('payOutSchedule')}: -
              </CustomText>
              <TouchableOpacity style={styles.button}>
                <CustomText style={styles.textButton}>
                  {t('InstanceWithdraw')}
                </CustomText>
                <Energy width={wp(6.5)} height={wp(7)} />
              </TouchableOpacity>
            </View>
            <View style={styles.topContainer}>
              <CustomText style={[styles.textBalance, {fontSize: wp(4.5)}]}>
                {t('PayoutActivity')}
              </CustomText>
              <TouchableOpacity>
                <CustomText
                  style={[
                    styles.textBalance,
                    {fontSize: wp(3.3), marginTop: hp(2.3)},
                  ]}>
                  {t('seeAll')}
                </CustomText>
              </TouchableOpacity>
            </View>
            <PaymentHistoryList data={dataTransaction?.items} />
          </>
        )}
      </KeyboardAwareScrollView>
    </CustomScreen>
  );
};

export default Report;

const styles = StyleSheet.create({
  balanceContainer: {
    marginTop: hp(2),
    width: wp(100),
    height: hp(23),
    backgroundColor: 'rgba(234, 234, 234, 0.5)',
    paddingLeft: wp(5),
  },
  textBalance: {
    fontSize: wp(5),
    fontWeight: 'bold',
    marginTop: hp(2),
    color: colors.gray400,
  },
  textPrice: {
    fontSize: wp(10),
    fontWeight: '900',
    color: colors.black,
  },
  button: {
    width: wp(43),
    height: hp(3),
    backgroundColor: colors.gray500,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(50),
    marginTop: hp(3),
    flexDirection: 'row',
  },
  textButton: {
    fontSize: wp(3.7),
    color: colors.black,
    fontWeight: '900',
  },
  topContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    height: hp(5),
    width: wp(88),
    marginHorizontal: wp(6),
  },
});
