import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { styles } from '../styles';
import NetflixCard from './NetflixCard';

export default function NetflixRow({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: any[];
  onSelect?: (item: any) => void;
}) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.movieRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={items}
        horizontal
        keyExtractor={(item, index) => `${item.id}-${index}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentList}
        renderItem={({ item }) => <NetflixCard item={item} onPress={onSelect} />}
      />
    </View>
  );
}
