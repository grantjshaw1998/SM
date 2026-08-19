import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { styles } from '../styles';
import { Colors } from '../constants/Colors';
import { imgUrl } from '../lib/tmdb';

export default function NetflixCard({ item, onPress }: { item: any; onPress?: (item: any) => void }) {
  const posterSource =
    item.poster_path && !item.poster_path.startsWith('http')
      ? { uri: imgUrl(item.poster_path, 'w342') }
      : item.poster_path
      ? { uri: item.poster_path }
      : undefined;

  const handlePress = () => {
    if (onPress) {
      onPress(item);
      return;
    }
    const params: any = {
      id: item.id,
      media_type: item.media_type,
    };
    if (item.media_type === 'anime' && item.anilistId) {
      params.anilistId = item.anilistId;
    }
    router.push({ pathname: '/detail/[id]', params });
  };

  return (
    <Pressable onPress={handlePress} style={styles.contentItem}>
      {posterSource ? (
        <Image source={posterSource} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={[styles.thumbnail, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#666' }}>No Image</Text>
        </View>
      )}
      <Text style={styles.title} numberOfLines={1}>
        {item.title || item.name || 'Untitled'}
      </Text>
    </Pressable>
  );
}
