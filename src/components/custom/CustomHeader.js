import React from 'react';
import { StyleSheet, TouchableOpacity, View ,Platform,Alert} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from "@react-navigation/native";

import colors from '../../config/colors';
import { MapArrow,Menu ,LocationPin1} from '../../../assets/svg';
import { useSelector } from 'react-redux';
import { selectConfig } from '../../redux/reducers/configReducer';
import { openExternalMap } from '../../utils/externalMap';


const CustomHeader = ({onRefreshPress,order }) => {
   const navigation = useNavigation();
  const config = useSelector(selectConfig);


     const openMaps = async () => {
       const lat =
         order?.status !== 'pickup'
           ? order?.sender_latitude
           : order?.receiver_latitude;
       const lng =
         order?.status !== 'pickup'
           ? order?.sender_longitude
           : order?.receiver_longitude;
       const label = order?.status !== 'pickup' ? 'Pickup' : 'Dropoff';
   
       // default: iOS -> apple, Android -> google
       const app =
         config?.externalMap ||
         (Platform.OS === 'ios' ? 'apple' : 'google');
   
       if (!lat || !lng) {
         Alert.alert('Error', 'Location coordinates not available.');
         return;
       }
   
       try {
         await openExternalMap(app, lat, lng, label);
       } catch (err) {
         console.error('Failed to open map:', err);
         Alert.alert('Error', t('mapAppNotInstalled', { app }));
       }
     };


    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <TouchableOpacity 
                activeOpacity={0.6}
                onPress={() => navigation.openDrawer()}
                style={styles.button}>
                   <Menu width={wp(5.5)} height={wp(5.5)}/>
                </TouchableOpacity>
            </View>
            <View style={[styles.left,{flexDirection:"row",justifyContent:"flex-end"}]}>
                {order && <TouchableOpacity
                                 activeOpacity={0.6}
                 onPress={openMaps}
                 style={[styles.button,{marginHorizontal:wp(2)}]}>
                  <MapArrow width={wp(5.5)} height={wp(5.5)} />
                </TouchableOpacity>}
                 <TouchableOpacity
                                 activeOpacity={0.6}
                 onPress={onRefreshPress}
                 style={styles.button}>
                  <LocationPin1 width={wp(5.5)} height={wp(5.5)} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default CustomHeader

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: hp(6),
        marginVertical:hp(1),
        position: 'absolute',
        top: hp(3.5),
        zIndex:9999,
        width:wp(100),
    },
    left: {
        justifyContent: 'center',
        alignItems: 'flex-start',
        width:wp(50),
        paddingHorizontal:wp(4)
    },
    button: {
       width: wp(10.5),
        height:wp(10.5),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: wp(2),
        backgroundColor: colors.white,
        borderColor:colors.neutral200,
        borderWidth:wp(0.4)
    },
});