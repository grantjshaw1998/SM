import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles';
import { useApiKey } from '../../context/ApiKeyContext';

const local = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', alignItems: 'center', paddingHorizontal: 24 },
  title: { color: '#E50914', fontSize: 38, fontWeight: 'bold', marginTop: 60, letterSpacing: 2 },
  spacer: { height: 40 },
  card: {
    width: '100%',
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#999', fontSize: 14 },
  value: { color: '#fff', fontSize: 15, fontWeight: '600' },
  button: {
    width: '100%',
    backgroundColor: '#E50914',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  githubButton: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  about: { color: '#888', fontSize: 13, lineHeight: 20, textAlign: 'center },
});

export default function ProfileScreen() {
  const { apiKey } = useApiKey();

  const handleChangeKey = () => {
    router.push({ pathname: '/setup' });
  };

  const handleGitHub = async () => {
    try {
      await openBrowserAsync('https://github.com/truelockmc/streambert');
    } catch (e) {
      // ignore
    }
  };

  const keySet = Boolean(apiKey);

  return (
    <SafeAreaView style={local.container}>
      <Text style={local.title}>STREAMFLIX</Text>
      <View style={local.spacer} />

      <View style={local.card}>
        <View style={local.row}>
          <Text style={local.label}>API Key</Text>
          <Text style={local.value}>{keySet ? 'Set' : 'Not set'}</Text>
        </View>
      </View>

      <Pressable style={local.button} onPress={handleChangeKey}>
        <Text style={local.buttonText}>Change API Key</Text>
      </Pressable>

      <Pressable style={local.githubButton} onPress={handleGitHub}>
        <Text style={[local.buttonText, { color: '#fff' }]}>GitHub</Text>
      </Pressable>

      <Text style={local.about}>
        StreamFlix — a Netflix-style client for movies, series &amp; anime powered
        by TMDB &amp; AniList. Not affiliated with Netflix.
      </Text>
    </SafeAreaView>
  );
}
