import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import {
  getSourceUrl,
  PLAYER_SOURCES,
  NON_ANIME_DEFAULT_SOURCE,
} from '../../lib/tmdb';
import { getAllMangaUrl } from '../../lib/anime';
import { setProgress } from '../../lib/library';

const local = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  backButton: {
    padding: 8,
  },
  spacer: { flex: 1 },
  sourceButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    marginLeft: 6,
  },
  sourceButtonActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  sourceButtonText: { color: '#fff', fontSize: 12 },
  webview: { flex: 1, marginTop: 0 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
});

export default function PlayerScreen() {
  const params: any = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const mediaType: string = params.media_type;
  const id = params.id;
  const anilistId = params.anilistId;
  const title = params.title;
  const season = params.season ? Number(params.season) : undefined;
  const episode = params.episode ? Number(params.episode) : undefined;
  const isAnime = mediaType === 'anime';

  const [sourceId, setSourceId] = useState<string>(
    isAnime ? 'allmanga' : NON_ANIME_DEFAULT_SOURCE
  );
  const [spinner, setSpinner] = useState(true);

  const resolvedUrl = (() => {
    if (isAnime) {
      return getAllMangaUrl(anilistId, title);
    }
    return getSourceUrl(sourceId, mediaType, id, season, episode);
  })();

  const sourcesToShow: any[] = Array.isArray(PLAYER_SOURCES) ? PLAYER_SOURCES : [];

  useEffect(() => {
    return () => {
      try {
        setProgress({
          id,
          media_type: mediaType,
          title,
          poster_path: undefined,
          season,
          episode,
          progress: 1,
        });
      } catch (e) {
        // best-effort
      }
    };
  }, [id, mediaType, season, episode, title]);

  const renderLoading = () => (
    <View style={local.loadingOverlay}>
      <ActivityIndicator size="large" color="#E50914" />
    </View>
  );

  return (
    <SafeAreaView style={local.container}>
      <StatusBar hidden={false} style="light" />
      <View style={[local.topBar, { paddingTop: insets.top + 4 }]}>
        <Pressable style={local.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={local.spacer} />
        {!isAnime
          ? sourcesToShow
              .filter((s) => s.id !== 'allmanga')
              .map((s) => (
                <Pressable
                  key={s.id}
                  style={[local.sourceButton, sourceId === s.id && local.sourceButtonActive]}
                  onPress={() => {
                    setSourceId(s.id);
                    setSpinner(true);
                  }}
                >
                  <Text style={local.sourceButtonText}>{s.name || s.id}</Text>
                </Pressable>
              ))
          : null}
      </View>

      <WebView
        style={local.webview}
        source={{ uri: resolvedUrl }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState
        renderLoading={renderLoading}
        onLoadEnd={() => setSpinner(false)}
      />

      {spinner ? renderLoading() : null}
    </SafeAreaView>
  );
}
