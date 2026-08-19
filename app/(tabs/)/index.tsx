import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles';
import { Colors } from '../../constants/Colors';
import { useApiKey } from '../../context/ApiKeyContext';
import {
  getTrending,
  getTopRated,
  imgUrl,
} from '../../lib/tmdb';
import { getAnilistTrending } from '../../lib/anilist';
import { getContinueWatching } from '../../lib/library';
import NetflixRow from '../../components/NetflixRow';

const local = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#E50914',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default function HomeScreen() {
  const { apiKey } = useApiKey();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [trendingTV, setTrendingTV] = useState<any[]>([]);
  const [topMovies, setTopMovies] = useState<any[]>([]);
  const [topTV, setTopTV] = useState<any[]>([]);
  const [anime, setAnime] = useState<any[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!apiKey) return;
    setLoading(true);
    setError('');
    try {
      const [tm, tt, tom, tot, anilist, cw] = await Promise.all([
        getTrending('movie', apiKey),
        getTrending('tv', apiKey),
        getTopRated('movie', apiKey),
        getTopRated('tv', apiKey),
        getAnilistTrending(),
        getContinueWatching(),
      ]);

      setTrendingMovies((tm?.results || []).map((i: any) => ({ ...i, media_type: 'movie' })));
      setTrendingTV((tt?.results || []).map((i: any) => ({ ...i, media_type: 'tv' })));
      setTopMovies((tom?.results || []).map((i: any) => ({ ...i, media_type: 'movie' })));
      setTopTV((tot?.results || []).map((i: any) => ({ ...i, media_type: 'tv' })));
      setAnime(
        (anilist || []).map((a: any) => ({
          id: a.id,
          title: a.title?.english || a.title?.romaji || a.title?.userPreferred,
          poster_path: a.coverImage?.large || a.coverImage?.medium,
          media_type: 'anime',
          anilistId: a.id,
        }))
      );
      setContinueWatching(Array.isArray(cw) ? cw : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    load();
  }, [load]);

  const hero = trendingMovies[0];

  const openDetail = (item: any) => {
    const params: any = { id: item.id, media_type: item.media_type };
    if (item.media_type === 'anime' && item.anilistId) params.anilistId = item.anilistId;
    router.push({ pathname: '/detail/[id]', params });
  };

  const openPlayer = (item: any) => {
    const params: any = {
      media_type: item.media_type === 'anime' ? 'anime' : item.media_type || 'movie',
      id: item.id,
      title: item.title || item.name,
    };
    if (item.media_type === 'anime' && item.anilistId) params.anilistId = item.anilistId;
    router.push({ pathname: '/player', params });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={local.loadingContainer}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={local.errorContainer}>
          <Text style={local.errorText}>{error}</Text>
          <Pressable style={local.retryButton} onPress={load}>
            <Text style={local.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {hero ? (
          <View style={styles.featuredContent}>
            <View style={styles.featuredWrapper}>
              <Image
                source={{ uri: imgUrl(hero.backdrop_path, 'original') }}
                style={styles.featuredImage}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)', '#000']}
                style={styles.featuredGradient}
              />
              <View style={styles.featuredOverlay}>
                <Text style={styles.previewTitle}>
                  {hero.title || hero.name}
                </Text>
                <View style={styles.featuredButtons}>
                  <Pressable style={styles.playButton} onPress={() => openPlayer(hero)}>
                    <Ionicons name="play" size={18} color="#000" />
                    <Text style={styles.playButtonText}>Play</Text>
                  </Pressable>
                  <Pressable style={styles.myListButton} onPress={() => openDetail(hero)}>
                    <Ionicons name="information-circle" size={18} color="#fff" />
                    <Text style={styles.myListButtonText}>More Info</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {continueWatching.length > 0 ? (
          <NetflixRow title="Continue Watching" items={continueWatching} onSelect={openDetail} />
        ) : null}
        <NetflixRow title="Trending Movies" items={trendingMovies} onSelect={openDetail} />
        <NetflixRow title="Trending TV Shows" items={trendingTV} onSelect={openDetail} />
        <NetflixRow title="Top Rated Movies" items={topMovies} onSelect={openDetail} />
        <NetflixRow title="Top Rated TV Shows" items={topTV} onSelect={openDetail} />
        <NetflixRow title="Trending Anime" items={anime} onSelect={openDetail} />
      </ScrollView>
    </SafeAreaView>
  );
}
