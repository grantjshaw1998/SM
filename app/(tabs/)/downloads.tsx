import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles';
import { Colors } from '../../constants/Colors';
import {
  getMyList,
  getContinueWatching,
  removeFromMyList,
  clearProgress,
} from '../../lib/library';
import NetflixCard from '../../components/NetflixCard';

const local = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  note: { color: '#777', fontSize: 12, textAlign: 'center', marginVertical: 16, paddingHorizontal: 24 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: '#999', fontSize: 16 },
  removeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
});

export default function DownloadsScreen() {
  const [myList, setMyList] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const [ml, cw] = await Promise.all([getMyList(), getContinueWatching()]);
      setMyList(Array.isArray(ml) ? ml : []);
      setContinueWatching(Array.isArray(cw) ? cw : []);
    } catch (e) {
      setMyList([]);
      setContinueWatching([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = (item: any) => {
    const params: any = { id: item.id, media_type: item.media_type };
    if (item.media_type === 'anime' && item.anilistId) params.anilistId = item.anilistId;
    router.push({ pathname: '/detail/[id]', params });
  };

  const handleRemoveFromList = async (item: any) => {
    try {
      await removeFromMyList(item.id, item.media_type);
      setMyList((prev) =>
        prev.filter((i) => !(i.id === item.id && i.media_type === item.media_type))
      );
    } catch (e) {
      Alert.alert('Error', 'Could not remove from My List');
    }
  };

  const handleClearProgress = async (item: any) => {
    try {
      await clearProgress(item.id, item.media_type);
      setContinueWatching((prev) =>
        prev.filter((i) => !(i.id === item.id && i.media_type === item.media_type))
      );
    } catch (e) {
      Alert.alert('Error', 'Could not clear progress');
    }
  };

  return (
    <SafeAreaView style={local.container}>
      <View style={local.header}>
        <Text style={local.headerTitle}>My List</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Text style={local.note}>
          Note: This app does not download video files. This is your local
          library of saved titles and resume progress.
        </Text>

        {continueWatching.length > 0 ? (
          <View style={styles.movieRow}>
            <Text style={styles.sectionTitle}>Continue Watching</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contentList}>
              {continueWatching.map((item, i) => (
                <View key={`${item.id}-${i}`} style={styles.contentItem}>
                  <Pressable onPress={() => openDetail(item)}>
                    <NetflixCard item={item} />
                  </Pressable>
                  <Pressable style={local.removeButton} onPress={() => handleClearProgress(item)}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={local.empty}>
            <Text style={local.emptyText}>Nothing in Continue Watching</Text>
          </View>
        )}

        {myList.length > 0 ? (
          <View style={styles.movieRow}>
            <Text style={styles.sectionTitle}>My List</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.contentList}>
              {myList.map((item, i) => (
                <View key={`${item.id}-${i}`} style={styles.contentItem}>
                  <Pressable onPress={() => openDetail(item)}>
                    <NetflixCard item={item} />
                  </Pressable>
                  <Pressable style={local.removeButton} onPress={() => handleRemoveFromList(item)}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={local.empty}>
            <Text style={local.emptyText}>Your list is empty</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
