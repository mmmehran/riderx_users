import React, {memo} from 'react';
import {StyleSheet, View, ActivityIndicator} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation} from '@react-navigation/native';

import CustomModal from '../components/common/CustomModal';
import colors from '../config/colors';

const LoadingModal = ({isVisible}) => {
  return (
    <>
      <CustomModal isVisible={isVisible} backdropOpacity={0.7}>
        <View style={styles.container}>
          <ActivityIndicator
            color={colors.primary}
            size={'large'}></ActivityIndicator>
        </View>
      </CustomModal>
    </>
  );
};

export default memo(LoadingModal);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
