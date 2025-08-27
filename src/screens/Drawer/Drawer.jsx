import React from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useTranslation} from 'react-i18next';
import {useDispatch, useSelector} from 'react-redux';

import CustomScreen from '../../components/common/CustomScreen';
import routes from '../../navigation/routes';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';
import {Star} from '../../../assets/svg/index';
import {
  logout,
  authenticated,
} from '../../redux/reducers/authenticationReducer';

const LoginEmail = props => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(authenticated);

  const data = [
    {
      id: 1,
      name: t('inbox'),
      onPress: () => console.log('ok'),
    },
    {
      id: 2,
      name: t('findRide'),
      onPress: () => console.log('ok'),
    },
    {
      id: 3,
      name: t('wallet'),
      onPress: () => props?.navigation.navigate(routes.WALLET),
    },
    {
      id: 4,
      name: t('account'),
      onPress: () => console.log('ok'),
    },
    {
      id: 5,
      name: t('report'),
      onPress: () => props?.navigation.navigate(routes.REPORT),
    },
    {
      id: 6,
      name: t('logOut'),
      onPress: () => dispatch(logout()),
    },
  ];

  return (
    <CustomScreen>
      <View style={styles.container}>
        <View style={styles.profileContainer}>
          <View style={styles.imageContainer}></View>
          <View style={styles.textContainer}>
            <CustomText numberOfLines={1} style={[styles.text]}>
              {user?.userProfile?.first_name} {user?.userProfile?.last_name}{' '}
            </CustomText>
            <View style={styles.row}>
              <CustomText style={styles.text}>
                {user?.userProfile?.city_name}
              </CustomText>
            </View>
          </View>
          <TouchableOpacity style={styles.stopButton}>
            <CustomText style={styles.textButton}>{t('stop')}</CustomText>
          </TouchableOpacity>
        </View>
        <View style={styles.rowContainer}>
          {data.map(item => {
            return (
              <TouchableOpacity
                onPress={item.onPress}
                key={item.id}
                style={styles.rowList}>
                <CustomText style={styles.textRowbutton}>
                  {item?.name}
                </CustomText>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.bottom}>
          <TouchableOpacity style={[styles.buttonBottom]}>
            <CustomText style={[styles.textButton, {fontSize: wp(7)}]}>
              {t('help')}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </CustomScreen>
  );
};

export default LoginEmail;

const styles = StyleSheet.create({
  rowList: {
    justifyContent: 'center',
    width: wp(80),
    backgroundColor: 'rgba(239, 239, 239, 0.63)',
    height: hp(7.5),
    marginVertical: hp(1),
  },
  buttonBottom: {
    width: wp(35),
    height: wp(35),
    left: wp(-5),
    top: hp(4.5),
    borderRadius: wp(50),
    backgroundColor: 'rgba(251, 188, 4, 0.4)',
    alignItems: 'center',
    paddingTop: hp(4.5),
    paddingLeft: wp(2.5),
  },
  bottom: {
    justifyContent: 'flex-end',
    flex: 1,
  },
  textRowbutton: {
    fontSize: wp(7.5),
    color: colors.black,
    fontWeight: '800',
    marginLeft: wp(6),
  },
  rowContainer: {
    marginTop: hp(6),
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(20),
    height: wp(20),
    backgroundColor: colors.grayLight,
    borderRadius: wp(50),
    marginRight: wp(4),
  },
  container: {
    overflow: 'hidden',
    flex: 1,
  },
  profileContainer: {
    marginTop: hp(4),
    alignItems: 'center',
    marginHorizontal: wp(6),
    flexDirection: 'row',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: hp(1),
  },
  text: {
    fontSize: wp(5),
    color: colors.black,
    fontWeight: '800',
  },
  stopButton: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(50),
    backgroundColor: 'rgba(251, 188, 4, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    width: wp(30),
    alignItems: 'flex-start',
  },
  textButton: {
    fontSize: wp(3.8),
    color: colors.black,
    fontWeight: '900',
  },
});
