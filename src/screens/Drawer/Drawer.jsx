import React from 'react';
import {View, StyleSheet, TouchableOpacity, Image} from 'react-native';
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
import {authenticated} from '../../redux/reducers/authenticationReducer';
import {
  selectConfig,
  setSelectVehicleVisible,
} from '../../redux/reducers/configReducer';
import {
  ArrowLeft1,
  TickYellow,
  Star2,
  WalletIcon,
  ArrowRightWhite,
  ArrowUpDown,
  VanIcon,
  CarIcon1,
  ScoterIcon,
  MotorIcon1,
  MyAccount,
  InviteFriends,
  VehicleInfo,
  FindRide,
  Services,
  DriverClub,
  Faq,
} from '../../../assets/svg/index';

const LoginEmail = props => {
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector(authenticated);
  const config = useSelector(selectConfig);

  const data = [
    {
      id: 1,
      name: t('MyAccount'),
      icon: <MyAccount width={wp(6)} height={wp(6)}></MyAccount>,
      onPress: () => props?.navigation.navigate(routes.MYACCOUNT),
    },
    // {
    //   id: 2,
    //   name: t('InviteFriends'),
    //   icon: <InviteFriends width={wp(6)} height={wp(6)}></InviteFriends>,
    //   // onPress: () => props?.navigation.navigate(routes.WALLET),
    // },
    {
      id: 3,
      name: t('tripHistory'),
      icon: <FindRide width={wp(6)} height={wp(6)}></FindRide>,
      onPress: () => props?.navigation.navigate(routes.REPORT),
    },
    {
      id: 4,
      name: t('VehicleInfo'),
      icon: <VehicleInfo width={wp(6)} height={wp(6)}></VehicleInfo>,
      onPress: () => props?.navigation.navigate(routes.CHOOSEVEHICLE),
    },
    {
      id: 5,
      name: t('FindRide'),
      icon: <FindRide width={wp(6)} height={wp(6)}></FindRide>,
      //  onPress: () => props?.navigation.navigate(routes.CHOOSEVEHICLE),
    },
    {
      id: 6,
      name: t('Services'),
      icon: <Services width={wp(6)} height={wp(6)}></Services>,
      onPress: () => props?.navigation.navigate(routes.CHOOSESERVICE),
    },
    // {
    //   id: 7,
    //   name: t('DriverClub'),
    //   icon: <DriverClub width={wp(6)} height={wp(6)}></DriverClub>,
    // },
    // {
    //   id: 8,
    //   name: t('FAQ&AboutUs'),
    //   icon: <Faq width={wp(6)} height={wp(6)}></Faq>,
    // },
  ];

  return (
    <CustomScreen>
      <View style={styles.left}>
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => props?.navigation.closeDrawer()}
          style={styles.button}>
          <ArrowLeft1 width={wp(3.5)} height={wp(3.5)}></ArrowLeft1>
        </TouchableOpacity>
        <CustomText style={styles.backText}>{t('back')}</CustomText>
      </View>
      <View style={styles.container}>
        <View style={styles.profileContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={{uri: user?.profile_image}}
              style={{width: wp(15), height: wp(15), borderRadius: wp(50)}}
            />
            <View style={styles.tickContainer}>
              <TickYellow width={wp(8)} height={wp(8)}></TickYellow>
            </View>
            <View style={styles.rowStatus}>
              <View
                style={[
                  styles.statusContainer,
                  !config?.socketStatus && {backgroundColor: colors.neutral400},
                ]}></View>
              <CustomText
                style={[
                  styles.textStatus,
                  !config?.socketStatus && {color: colors.neutral300},
                ]}>
                {config?.socketStatus ? t('online') : t('offline')}
              </CustomText>
            </View>
          </View>
        </View>
        <View style={styles.textContainer}>
          <CustomText numberOfLines={1} style={styles.text}>
            {user?.userProfile?.first_name} {user?.userProfile?.last_name}
          </CustomText>
          <View style={styles.rowStar}>
            <Star2 width={wp(5)} height={wp(5)}></Star2>
            <CustomText style={styles.starText}>4.5</CustomText>
          </View>
        </View>
        <View style={styles.rowVehicle}>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => {
              props?.navigation.closeDrawer();
              dispatch(setSelectVehicleVisible(!config?.selectVehicleVisible));
            }}
            style={[
              styles.button,
              {
                width: wp(10),
                height: wp(10),
              },
            ]}>
            <ArrowUpDown width={wp(5)} height={wp(5)}></ArrowUpDown>
          </TouchableOpacity>
          {(config?.selectVehicle?.vehicle_type == 'van_1t' ||
            config?.selectVehicle?.vehicle_type == 'van_2t' ||
            config?.selectVehicle?.vehicle_type == 'van_3.5t') && (
            <VanIcon width={wp(14)} height={hp(4)}></VanIcon>
          )}
          {(config?.selectVehicle?.vehicle_type == 'motorcycle' ||
            config?.selectVehicle?.vehicle_type == 'bicycle' ||
            config?.selectVehicle?.vehicle_type == 'e_bicycle') && (
            <MotorIcon1 width={wp(14)} height={hp(4)}></MotorIcon1>
          )}
          {config?.selectVehicle?.vehicle_type == 'car' && (
            <CarIcon1 width={wp(14)} height={hp(4)}></CarIcon1>
          )}
          {config?.selectVehicle?.vehicle_type == 'moped' && (
            <ScoterIcon width={wp(14)} height={hp(4)}></ScoterIcon>
          )}
          <CustomText style={[styles.textCurrentVehicle]}>
            {config?.selectVehicle?.vehicle_brand
              ? ` ${config?.selectVehicle?.vehicle_brand?.title} ${config?.selectVehicle?.vehicle_model?.title} ${config?.selectVehicle?.vehicle_model?.model_type}`
              : `${
                  (config?.selectVehicle?.vehicle_type ?? '')
                    .charAt(0)
                    .toUpperCase() +
                  (config?.selectVehicle?.vehicle_type ?? '').slice(1)
                }`}
          </CustomText>
        </View>
        <TouchableOpacity
          onPress={() => props?.navigation.navigate(routes.WALLET)}
          style={styles.walletContainer}>
          <WalletIcon width={wp(8)} height={wp(8)}></WalletIcon>
          <View>
            <CustomText style={styles.priceText}>$39.00</CustomText>
            <CustomText style={styles.walletText}>{t('yourWallet')}</CustomText>
          </View>
          <View style={styles.iconWallet}>
            <ArrowRightWhite></ArrowRightWhite>
          </View>
        </TouchableOpacity>
        <View style={styles.rowContainer}>
          {data.map(item => (
            <TouchableOpacity
              onPress={item.onPress}
              key={item.id}
              style={styles.rowList}>
              {item?.icon}
              <CustomText style={styles.textRowbutton}>{item.name}</CustomText>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.bottomContainer}>
          <View style={styles.switchAccountContainer}>
            <TouchableOpacity style={styles.buttonSwitch}>
              <CustomText style={styles.textButtonSwitch}>
                {t('DriverApp')}
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => props?.navigation.navigate(routes.SENDER)}
              style={[styles.buttonSwitch, {backgroundColor: 'transparent'}]}>
              <CustomText
                style={[styles.textButtonSwitch, {color: colors.neutral300}]}>
                {t('UserApp')}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </CustomScreen>
  );
};

export default LoginEmail;

const styles = StyleSheet.create({
  rowList: {
    alignItems: 'center',
    width: wp(79),
    height: hp(5.5),
    marginBottom: hp(1),
    borderBottomColor: colors.neutral100,
    borderBottomWidth: wp(0.2),
    marginLeft: wp(4),
    flexDirection: 'row',
    paddingBottom: hp(0.5),
  },
  buttonSwitch: {
    width: wp(37.5),
    height: hp(4.3),
    backgroundColor: colors.white,
    borderRadius: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp(1),
  },
  switchAccountContainer: {
    width: wp(80),
    height: hp(5.5),
    backgroundColor: colors.neutral100,
    marginBottom: hp(2),
    marginLeft: wp(4),
    borderRadius: wp(3),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  textCurrentVehicle: {
    color: colors.neonTeal500,
    fontFamily: 'YaldeviJaffna-Bold',
    fontSize: wp(4.5),
  },
  textButtonSwitch: {
    color: colors.neutral900,
    fontFamily: 'YaldeviJaffna-Bold',
    fontSize: wp(4.5),
  },
  rowVehicle: {
    flexDirection: 'row',
    marginLeft: wp(4),
    marginTop: hp(0.5),
    marginBottom: hp(1),
    alignItems: 'center',
  },
  walletContainer: {
    width: wp(80),
    height: hp(6.5),
    backgroundColor: colors.neutral900,
    marginLeft: wp(4),
    borderRadius: wp(2),
    marginTop: hp(1),
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: wp(2.5),
  },
  iconWallet: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: wp(3),
  },
  tickContainer: {
    position: 'absolute',
    right: wp(-2.5),
    top: 0,
  },
  statusContainer: {
    width: wp(4.2),
    height: wp(4.2),
    backgroundColor: colors.successBase,
    borderRadius: wp(20),
    borderWidth: wp(0.8),
    borderColor: colors.white,
  },
  rowStatus: {
    position: 'absolute',
    right: wp(-12),
    top: hp(4.5),
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontFamily: 'YaldeviJaffna-Bold',
    color: colors.contentSecondary,
    marginLeft: wp(2),
    fontSize: wp(4.8),
  },
  priceText: {
    fontFamily: 'YaldeviJaffna-Bold',
    color: colors.neonTeal300,
    marginLeft: wp(2),
    fontSize: wp(4.5),
  },
  walletText: {
    color: colors.white,
    marginLeft: wp(2),
    fontSize: wp(3),
  },
  textStatus: {
    fontFamily: 'YaldeviJaffna-Bold',
    color: colors.success900,
    marginLeft: wp(0.5),
    fontSize: wp(4),
  },
  left: {
    flexDirection: 'row',
    marginLeft: wp(4),
    alignItems: 'center',
  },
  button: {
    width: wp(7.5),
    height: wp(7.5),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(2),
    backgroundColor: colors.white,
    borderColor: colors.neutral200,
    borderWidth: wp(0.4),
  },
  bottom: {justifyContent: 'flex-end', flex: 1},
  textRowbutton: {
    fontSize: wp(5.8),
    color: colors.contentSecondary,
    marginLeft: wp(2.5),
    fontFamily: 'YaldeviJaffna-Bold',
  },
  rowContainer: {marginTop: hp(2)},
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(15),
    height: wp(15),
    backgroundColor: colors.grayLight,
    marginRight: wp(2),
    borderRadius: wp(50),
  },
  container: {flex: 1},
  profileContainer: {
    marginTop: hp(2),
    alignItems: 'center',
    marginLeft: wp(4),
    flexDirection: 'row',
  },
  row: {flexDirection: 'row-reverse', alignItems: 'center', marginTop: hp(1)},
  text: {
    fontSize: wp(7),
    color: colors.black,
    fontFamily: 'YaldeviJaffna-Bold',
  },
  textContainer: {
    width: wp(70),
    alignItems: 'center',
    marginRight: wp(2),
    marginLeft: wp(4),
    marginTop: hp(1),
    flexDirection: 'row',
  },
  rowStar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: wp(1.5),
  },
  starText: {
    color: colors.strong900,
    marginLeft: wp(0.5),
  },
  sheet: {
    backgroundColor: '#fff',
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    paddingBottom: hp(3),
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
  },
});
