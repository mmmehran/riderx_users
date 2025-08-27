import React, { memo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

import ReportListRenderItem from '../renderItems/ReportListRenderItem';

const ReportList = ({ data }) => {

    return (
        <View>
             <FlatList
                data={data}
                renderItem={({ item, index }) => {
                    return (
                        <ReportListRenderItem
                            item={item}
                            key={index}
                        ></ReportListRenderItem>
                    )
                }}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: hp(2) }}
            /> 
        </View>
    )
}

export default memo(ReportList);

const styles = StyleSheet.create({
    main: {
        flex: 1
    }

});