// ReportList.js
import React, { memo } from 'react';
import { FlatList, StyleSheet, View, RefreshControl } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import ReportListRenderItem from '../renderItems/ReportListRenderItem';

const ReportList = ({ data = [], refreshing, onRefresh, onEndReached, ListFooterComponent }) => {
  return (
    <View>
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <ReportListRenderItem item={item} />
        )}
        keyExtractor={(item, idx) => String(item?.id ?? idx)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp(10) }}
        refreshControl={
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />
        }
        onEndReachedThreshold={0.4}
        onEndReached={onEndReached}
        ListFooterComponent={ListFooterComponent}
      />
    </View>
  );
};

export default memo(ReportList);

const styles = StyleSheet.create({
  main: { flex: 1,marginTop:hp(2) },
});
