import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import CustomScreen from '../../components/common/CustomScreen';
import colors from '../../config/colors';
import CustomText from '../../components/common/CustomText';
import {
  TickYellow,
  EditIcon,
  FileGray,
  FileGreen,
  FileRed,
  LanguageIcon,
  NotificationIcon,
  PasswordIcon,
  ArrowRightGray,
  Settings,
} from '../../../assets/svg/index';
import CustomHeaderApp from '../../components/custom/CustomHeaderApp';
import { postData } from '../../services/common.service';
import urls from '../../services/urls.json';
import errorHandler from '../../utils/errorHandler';
import {
  logout,
  authenticated,
} from '../../redux/reducers/authenticationReducer';
import { logouConfig } from '../../redux/reducers/configReducer';
import routes from '../../navigation/routes';

const MyAccount = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const user = useSelector(authenticated);
  const dispatch = useDispatch();



  const routesData = [
    {
      id: 1,
      name: t('ChangeLanguage'),
      icon: <LanguageIcon width={wp(3.5)} height={wp(3.5)}></LanguageIcon>,
      onPress: () => navigation.navigate(routes.CHANGELANGUAGE),
    },
    {
      id: 2,
      name: t('externalMap'),
      icon: <LanguageIcon width={wp(3.5)} height={wp(3.5)}></LanguageIcon>,
      onPress: () => navigation.navigate(routes.SELECTEXTERNALMAP),
    },
    {
      id: 2,
      name: t('mapStyle'),
      icon: <LanguageIcon width={wp(3.5)} height={wp(3.5)}></LanguageIcon>,
      onPress: () => navigation.navigate(routes.MAPSTYLE),
    },
    // {
    //   id: 2,
    //   name: t('Notification'),
    //   icon: (
    //     <NotificationIcon width={wp(3.5)} height={wp(3.5)}></NotificationIcon>
    //   ),
    // },
  ];



  return (
    <CustomScreen>
      <CustomHeaderApp title={t('appSettings')} />
      <View>
        {routesData?.map(item => {
          return (
            <TouchableOpacity onPress={item?.onPress} style={styles.rowRoute}>
              <CustomText style={styles.textRoute}>{item?.name}</CustomText>
              <View style={styles.arrowContainer}>
                <ArrowRightGray width={wp(4)} height={wp(4)}></ArrowRightGray>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </CustomScreen>
  );
};

export default MyAccount;

const styles = StyleSheet.create({
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(15),
    height: wp(15),
    backgroundColor: colors.grayLight,
    marginRight: wp(2),
    borderRadius: wp(50),
  },
  logoutContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  textLogout: {
    color: colors.error900,
    marginLeft: wp(2),
    fontSize: wp(3.7),
    fontFamily: 'YaldeviJaffna-Bold',
  },
  buttonLogOut: {
    width: wp(28),
    height: hp(6),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: colors.error50,
    borderRadius: wp(2.5),
    marginLeft: wp(6),
    marginBottom: hp(3),
  },
  iconContainer1: {
    width: wp(6.5),
    height: wp(6.5),
    backgroundColor: colors.neutral900,
    borderRadius: wp(1.6),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(3.5),
    marginRight: wp(2),
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: hp(0.4),
  },
  textRoute: {
    color: colors.neutral800,
    fontSize: wp(3.8),
    marginLeft: wp(5)
  },
  arrowContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: wp(3),
  },
  rowRoute: {
    flexDirection: 'row',
    width: wp(90),
    height: hp(6.5),
    borderColor: colors.neutral100,
    borderWidth: wp(0.3),
    borderRadius: wp(2.5),
    marginHorizontal: wp(5),
    marginTop: hp(2),
    alignItems: 'center',
  },
  statusContainer: {
    width: wp(28.5),
    height: hp(6.2),
    borderRadius: wp(2),
    justifyContent: 'center',
    backgroundColor: colors.white,
    elevation: 10,
    marginHorizontal: wp(1),
    paddingHorizontal: wp(3),
  },
  rowStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: hp(4),
    marginBottom: hp(1),
  },
  tickContainer: {
    position: 'absolute',
    right: wp(-2.5),
    top: 0,
  },
  rowHeader: {
    marginLeft: wp(6),
    marginTop: hp(3),
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    marginLeft: wp(2),
  },
  iconContainer: {
    marginRight: wp(4.5),
  },
  nameUser: {
    color: colors.neutral800,
    fontFamily: 'YaldeviJaffna-Bold',
    fontSize: wp(5),
  },
  textValue: {
    color: colors.neutral900,
    fontFamily: 'YaldeviJaffna-Bold',
    fontSize: wp(4),
    marginTop: hp(0.4),
  },
  textName: {
    color: colors.neutral900,
    fontSize: wp(3.4),
  },
  phoneText: {
    color: colors.neutral500,
    fontSize: wp(3.5),
  },
});
