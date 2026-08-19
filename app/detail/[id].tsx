import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles';
import { useApiKey } from '../../context/ApiKeyContext';
import {
  getDetails,
  getCredits,
  getSeasonEpisodes,
  imgUrl,
  fetchAnilistData,
} from '../../lib/tmdb';
import {
  addToMyList,
  removeFromMyList,
  isInMyList,
} from '../../lib/library';

const local = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  errorText: { color: '#fff', fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#E50914', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 6 },
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerImage: { width: '100%', height: 260 },
  headerGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%' },
  headerOverlay: { paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaText: { color: '#ddd', fontSize: 13 },
  ratingBadge: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, color: '#fff', fontSize: 13 },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  genreChip: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  genreText: { color: '#fff', fontSize: 12 },
  overview: { color: '#bbb', fontSize: 14, lineHeight: 21, marginTop: 16, marginHorizontal: 16 },
  sectionLabel: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 16, marginTop: 20, marginBottom: 10 },
  castList: { paddingHorizontal: 16 },
  castItem: { width: 90, marginRight: 12 },
  castImage: { width: 90, height: 130, borderRadius: 8, backgroundColor: '#222' },
  castName: { color: '#fff', fontSize: 12, marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 16, marginHorizontal: 16, marginTop: 20 },
  seasonRow: { paddingHorizontal: 16, marginTop: 10 },
  seasonButton: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, marginRight: 10 },
  seasonButtonActive: { backgroundColor: '#E50914', borderColor: '#E50914' },
  seasonButtonText: { color: '#fff', fontSize: 13 },
  episodeItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', gap: 12 },
  episodeImage: { width: 100, height: 56, borderRadius: 6, backgroundColor: '#222' },
  episodeInfo: { flex: 1 },
  episodeTitle: { color: '#fff', fontSize: 14 },
  episodeNum: { color: '#999', fontSize: 12, marginTop: 2 },
});

function cleanAnilistDescription(desc?: string) {
  if (!desc) return '';
  return desc.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
}

export default function DetailScreen() {
  const params: any = useLocalSearchParams();
  const { apiKey } = useApiKey();

  const rawMediaType: string = params.media_type;
  const isAnime = rawMediaType === 'anime';
  const mediaType = isAnime ? 'tv' : rawMediaType || 'movie';

  const id = params.id;
  const anilistId = params.anilistId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [details, setDetails] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [anilistData, setAnilistData] = useState<any>(null);
  const [inMyList, setInMyList] = useState(false);

  const [selectedSeason, setSelectedSeason] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [d, c] = await Promise.all([
        getDetails(id, mediaType, apiKey),
        getCredits(id, mediaType, apiKey),
      ]);
      setDetails(d);
      setCredits(c);

      if (isAnime && (anilistId || d?.title || d?.name)) {
        try {
          const al = await fetchAnilistData(d?.title || d?.name, 'ANIME', id);
          setAnilistData(al);
        } catch (e) {
          // optional
        }
      }

      setInMyList(await isInMyList(id, isAnime ? 'anime' : mediaType));

      if (mediaType === 'tv' && d?.seasons && d.seasons.length > 0) {
        const first = d.seasons.find((s: any) => s.season_number > 0) || d.seasons[0];
        setSelectedSeason(first);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load details');
    } finally {
      setLoading(false);
    }
  }, [id, mediaType, apiKey, isAnime, anilistId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    if (mediaType === 'tv' && selectedSeason) {
      getSeasonEpisodes(id, selectedSeason.season_number, apiKey)
        .then((eps: any) => {
          if (!cancelled) {
            setEpisodes(eps?.episodes || []);
            setSelectedEpisode((eps?.episodes || [])[0] || null);
          }
        })
        .catch(() => {
          if (!cancelled) setEpisodes([]);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [selectedSeason, mediaType, id, apiKey]);

  const toggleMyList = async () => {
    try {
      if (inMyList) {
        await removeFromMyList(id, isAnime ? 'anime' : mediaType);
        setInMyList(false);
      } else {
        await addToMyList({
          id,
          media_type: isAnime ? 'anime' : mediaType,
          title: details?.title || details?.name,
          name: details?.name || details?.title,
          poster_path: details?.poster_path,
          backdrop_path: details?.backdrop_path,
          anilistId,
        });
        setInMyList(true);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not update My List');
    }
  };

  const handlePlay = () => {
    const playParams: any = {
      media_type: isAnime ? 'anime' : mediaType,
      id,
      title: details?.title || details?.name,
    };
    if (isAnime && anilistId) playParams.anilistId = anilistId;
    if (mediaType === 'tv' && selectedSeason) {
      playParams.season = selectedSeason.season_number;
      playParams.episode = selectedEpisode?.episode_number || 1;
    }
    router.push({ pathname: '/player', params: playParams });
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

  const title = details?.title || details?.name || anilistData?.title?.english || anilistData?.title?.romaji || 'Untitled';
  const year = (details?.release_date || details?.first_air_date || '').slice(0, 4);
  const rating = details?.vote_average ? details.vote_average.toFixed(1) : 'NR';
  const genres = details?.genres || [];
  const overview = anilistData?.description
    ? cleanAnilistDescription(anilistData.description)
    : details?.overview || '';
  const cast = (credits?.cast || []).slice(0, 5);
  const backdropUri = details?.backdrop_path
    ? { uri: imgUrl(details.backdrop_path, 'w780') }
    : details?.poster_path
    ? { uri: imgUrl(details.poster_path, 'w780') }
    : undefined;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View>
          {backdropUri ? (
            <Image source={backdropUri} style={local.headerImage} resizeMode="cover" />
          ) : (
            <View style={[local.headerImage, { backgroundColor: '#222' }]} />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.9)', '#000']}
            style={local.headerGradient}
          />
          <View style={local.headerOverlay}>
            <Text style={local.headerTitle}>{title}</Text>
            <View style={local.metaRow}>
              {year ? <Text style={local.metaText}>{year}</Text> : null}
              <Text style={local.ratingBadge}>{rating}</Text>
            </View>
            {genres.length > 0 ? (
              <View style={local.genres}>
                {genres.map((g: any) => (
                  <View key={g.id} style={local.genreChip}>
                    <Text style={local.genreText}>{g.name}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {overview ? <Text style={local.overview}>{overview}</Text> : null}

        <View style={local.actionRow}>
          <Pressable style={styles.playButton} onPress={handlePlay}>
            <Ionicons name="play" size={18} color="#000" />
            <Text style={styles.playButtonText}>Play</Text>
          </Pressable>
          <Pressable
            style={[styles.myListButton, inMyList && { backgroundColor: '#E50914' }]}
            onPress={toggleMyList}
          >
            <Ionicons name={inMyList ? 'checkmark' : 'add'} size={18} color="#fff" />
            <Text style={styles.myListButtonText}>{inMyList ? 'In My List' : 'My List'}</Text>
          </Pressable>
        </View>

        {cast.length > 0 ? (
          <View>
            <Text style={local.sectionLabel}>Top Cast</Text>
            <FlatList
              data={cast}
              horizontal
              keyExtractor={(item, i) => `${item.id}-${i}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={local.castList}
              renderItem={({ item }) => (
                <View style={local.castItem}>
                  {item.profile_path ? (
                    <Image source={{ uri: imgUrl(item.profile_path, 'w185') }} style={local.castImage} resizeMode="cover" />
                  ) : (
                    <View style={local.castImage} />
                  )}
                  <Text style={local.castName} numberOfLines={2}>{item.name}</Text>
                </View>
              )}
            />
          </View>
        ) : null}

        {mediaType === 'tv' && details?.seasons && details.seasons.length > 0 ? (
          <View>
            <Text style={local.sectionLabel}>Seasons</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.seasonRow}>
              {details.seasons
                .filter((s: any) => s.season_number > 0)
                .map((s: any) => (
                  <Pressable
                    key={s.id}
                    style={[local.seasonButton, selectedSeason?.id === s.id && local.seasonButtonActive]}
                    onPress={() => setSelectedSeason(s)}
                  >
                    <Text style={local.seasonButtonText}>{s.name}</Text>
                  </Pressable>
                ))}
            </ScrollView>

            <Text style={local.sectionLabel}>Episodes</Text>
            <View style={{ paddingHorizontal: 16 }}>
              {episodes.map((ep: any) => (
                <Pressable
                  key={ep.id}
                  style={local.episodeItem}
                  onPress={() => setSelectedEpisode(ep)}
                >
                  {ep.still_path ? (
                    <Image source={{ uri: imgUrl(ep.still_path, 'w185') }} style={local.episodeImage} resizeMode="cover" />
                  ) : (
                    <View style={local.episodeImage} />
                  )}
                  <View style={local.episodeInfo}>
                    <Text style={local.episodeTitle} numberOfLines={2}>
                      {ep.episode_number}. {ep.name}
                    </Text>
                    {selectedEpisode?.id === ep.id ? (
                      <Text style={local.episodeNum}>Selected</Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
