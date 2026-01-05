import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/core';
import { useDispatch, useSelector } from 'react-redux';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';
import CustomHeaderChat from '../../components/custom/CustomHeaderChat';
import PaymentHistoryList from '../../components/list/PaymentHistoryList';
import { getData } from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import { setUserWallet, authenticated } from '../../redux/reducers/authenticationReducer';

const ChatScreen = props => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dataTransaction, setDataTransaction] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector(authenticated);



  return (
    <CustomScreen>
      <CustomHeaderChat title={t('yourWallet')} />

    </CustomScreen>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  balanceContainer: {
    marginTop: hp(2),
    width: wp(94),
    borderRadius: wp(2),
    borderColor: colors.neutral100,
    borderWidth: wp(0.3),
    marginHorizontal: wp(3),
    alignItems: 'center',
    paddingVertical: hp(1.3),
  },
  rowBottom: {
    flex: 2,
    justifyContent: 'flex-end',
    paddingBottom: hp(2),
  },
  dot: {
    width: wp(1.8),
    height: wp(1.8),
    borderRadius: wp(5),
    backgroundColor: colors.neonTeal300,
    marginRight: wp(1.5),
  },
  statusContainer: {
    height: hp(3.2),
    borderColor: colors.neutral200,
    borderWidth: wp(0.3),
    borderRadius: wp(2),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: wp(2.5),
    flexDirection: 'row',
    marginTop: hp(3),
    marginRight: wp(5),
  },
  textSeeAll: {
    fontSize: wp(4.5),
    color: colors.neonTeal400,
    fontFamily: 'YaldeviJaffna-Bold',
  },
  textHistory: {
    fontSize: wp(4.5),
    color: colors.neutral800,
    fontFamily: 'YaldeviJaffna-Bold',
  },
  rowTop: {
    flex: 1,
    alignItems: 'flex-end',
  },
  textBalance: {
    fontSize: wp(4.5),
    marginTop: hp(4),
    color: colors.neutral100,
    marginLeft: wp(5),
  },
  balanceImage: {
    width: wp(88),
    height: hp(24),
  },
  textPrice: {
    fontSize: wp(9),
    color: colors.white,
    fontFamily: 'arial',
    marginLeft: wp(5),
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
    flexDirection: 'row',
    marginHorizontal: wp(4.5),
    marginTop: hp(3),
  },
});
