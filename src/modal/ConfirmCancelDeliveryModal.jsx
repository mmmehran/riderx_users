import React, {memo} from 'react';
import {StyleSheet, View, TouchableOpacity} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import CustomModal from '../components/common/CustomModal';
import CustomText from '../components/common/CustomText';
import colors from '../config/colors';
import {CancelIcon1, TickIcon} from '../../assets/svg/index';

const WHITE = colors?.white || '#FFFFFF';
const GRAY = '#6B7280';
const BORDER = '#E5E7EB';

const ConfirmCancelDeliveryModal = ({
  isVisible,
  title,
  confirmText,
  onConfirm,
  onCancel,
  content,
  type,
  price,
  content1,
  content2
}) => {
  return (
    <CustomModal
      isVisible={isVisible}
      backdropOpacity={0.5}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}>
      <View style={styles.container}>
        <View
          style={[
            styles.cancelContainer,
            type && {backgroundColor: colors.success900},
          ]}>
          {type ? (
            <TickIcon></TickIcon>
          ) : (
            <CancelIcon1 width={wp(12)} height={wp(12)}></CancelIcon1>
          )}
        </View>
        <CustomText style={[styles.title, type && {color: colors.success900}]}>
          {title}
        </CustomText>
        {
          type ?
          <>
          <View style={[styles.row,{marginHorizontal:wp(18),marginBottom:0}]}>
          <CustomText style={styles.content}>
          {content1}
        </CustomText> 
          <CustomText style={[styles.content,{ fontFamily: 'arial', fontWeight:'bold'}]}>
          € {price}
        </CustomText> 
            </View>
          <CustomText style={styles.content}>
          {content2}
        </CustomText> 
        </>
        :
        <CustomText style={styles.content}>{content}</CustomText>
        }
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSolid]}
            onPress={() => {
              onConfirm();
            }}>
            <CustomText style={styles.btnSolidText}>{confirmText}</CustomText>
          </TouchableOpacity>
        </View>
      </View>
    </CustomModal>
  );
};

export default memo(ConfirmCancelDeliveryModal);

const styles = StyleSheet.create({
  container: {
    width: wp(90),
    backgroundColor: WHITE,
    borderRadius: wp(4),
    paddingVertical: hp(2.2),
    paddingHorizontal: wp(5),
    alignItems: 'center',
  },
  cancelContainer: {
    width: wp(19),
    height: wp(19),
    backgroundColor: colors.error900,
    borderRadius: wp(50),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(5),
  },
  input: {
    width: wp(60),
    height: hp(4),
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  title: {
    fontSize: wp(6),
    color: colors.error900,
    textAlign: 'center',
    marginBottom: hp(0.5),
    fontFamily: 'YaldeviJaffna-Bold',
    marginTop: hp(2),
  },
  content: {
    fontSize: wp(4),
    color: colors.neutral600,
    textAlign: 'center',
    lineHeight: hp(3),
    fontFamily: 'YaldeviJaffna-Bold',
  },
  message: {
    marginTop: hp(1.2),
    fontSize: wp(3.8),
    color: GRAY,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    marginTop: hp(1),
    marginBottom: hp(1),
  },
  btn: {
    width: wp(75),
    height: hp(5),
    borderRadius: wp(2.3),
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: wp(2),
    paddingHorizontal: wp(3),
    marginTop: hp(3),
    marginBottom: hp(3),
  },
  btnGhost: {
    backgroundColor: colors.red,
    borderWidth: 1,
    borderColor: BORDER,
  },
  btnGhostText: {
    color: colors.white,
    fontSize: wp(3.5),
  },
  btnSolid: {
    backgroundColor: colors.black,
  },
  btnSolidText: {
    color: WHITE,
    fontSize: wp(4),
    fontFamily: 'YaldeviJaffna-Bold',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
