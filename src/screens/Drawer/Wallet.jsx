import React, {useCallback, useState} from 'react';
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
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/core';
import {useDispatch,useSelector} from 'react-redux';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';
import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import PaymentHistoryList from '../../components/list/PaymentHistoryList';
import {getData} from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import {setUserWallet,authenticated} from '../../redux/reducers/authenticationReducer'

const Report = props => {
  const {t} = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dataTransaction, setDataTransaction] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector(authenticated);

  const getWallet = async (pageNumber = 1) => {
    if (pageNumber === 1) setLoading(true);
    
    if (pageNumber === 1) {
        const response = await getData(urls.GETWALLET);
        if (response?.data?.status) {
          dispatch(setUserWallet(response?.data?.data))
        } else {
          errorHandler(response);
        }
    }

    const responseTransaction = await getData(`${urls.GETWALLETTRANSACTION}?page_size=5&page=${pageNumber}`);
    if (responseTransaction?.data?.status) {
      const newItems = responseTransaction?.data?.data?.items || [];
      
      if (pageNumber === 1) {
          setDataTransaction(responseTransaction?.data?.data);
      } else {
          setDataTransaction(prev => ({
              ...prev,
              items: [...(prev?.items || []), ...newItems]
          }));
      }
      
      if (newItems.length < 5) {
          setHasMore(false);
      } else {
          setHasMore(true);
      }
    } else {
      errorHandler(responseTransaction);
    }
    
    setLoading(false);
    setLoadingMore(false);
  };

  useFocusEffect(
    useCallback(() => {
      setPage(1);
      setHasMore(true);
      getWallet(1);
    }, []),
  );
  
  const loadMore = () => {
      if (!loadingMore && hasMore && !loading) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          getWallet(nextPage);
      }
  }

  const renderFooter = () => {
      if (!loadingMore) return null;
      return (
          <View style={{paddingVertical: 20}}>
              <ActivityIndicator size="small" color="#000" />
          </View>
      )
  }

  const renderHeader = () => (
      <>
        <View style={styles.balanceContainer}>
          <ImageBackground
            resizeMode="contain"
            source={require('../../../assets/image/walletCart.png')}
            style={styles.balanceImage}>
            <View style={styles.rowTop}>
              <View style={styles.statusContainer}>
                <View style={styles.dot} />
                <CustomText>
                  {user?.wallet[0] && user?.wallet[0]?.status
                    ? user?.wallet[0]?.status.charAt(0).toUpperCase() +
                      user?.wallet[0]?.status.slice(1)
                    : ''}
                </CustomText>
              </View>
            </View>
            <View style={styles.rowBottom}>
              <CustomText style={styles.textBalance}>
                {t('SavingsCard')}
              </CustomText>
              <CustomText style={styles.textPrice}>
                € {user?.wallet && user?.wallet[0]?.balance}
              </CustomText>
            </View>
          </ImageBackground>
        </View>
        <View style={styles.topContainer}>
          <CustomText style={styles.textHistory}>{t('history')}</CustomText>
        </View>
      </>
  );

  return (
    <CustomScreen>
      <CustomHeaderApp title={t('yourWallet')} />
        {loading ? (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size={'large'} color={'#000'} />
          </View>
        ) : (
            <PaymentHistoryList 
                data={dataTransaction?.items} 
                ListHeaderComponent={renderHeader()}
                onEndReached={loadMore}
                ListFooterComponent={renderFooter()}
            />
        )}
    </CustomScreen>
  );
};

export default Report;

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
    fontFamily: 'YaldeviJaffna-Bold',
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
