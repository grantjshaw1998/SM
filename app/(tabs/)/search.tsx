import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../../styles';
import { Colors } from '../../constants/Colors';
import { useApiKey } from '../../context/ApiKeyContext';
import { searchMulti } from '../../lib/tmdb';
import NetflixCard from '../../components/NetflixCard';

const local = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  message: {
    color: '#999',
    fontSize: 15,
    textAlign: 'center',
  },
  grid: {
    paddingHorizontal: 16,
  },
});

export default function SearchScreen() {
  const { apiKey } = useApiKey();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchMulti(query.trim(), apiKey);
        const items = (data?.results || []).filter(
          (r: any) => r.media_type === 'movie' || r.media_type === 'tv'
        );
        setResults(items);
        setSearched(true);
      } catch (e) {
        setResults([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, apiKey]);

  const filtered = results.filter(
    (r) => r.media_type === 'movie' || r.media_type === 'tv'
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={local.searchBar}>
        <Ionicons name="search" size={20} color="#999" style={local.searchIcon} />
        <TextInput
          style={local.input}
          placeholder="Search movies, shows..."
          placeholderTextColor="#888"
          value={query}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
        />
      </View>

      {loading ? (
        <View style={local.center}>
          <ActivityIndicator size="large" color="#E50914" />
        </View>
      ) : !searched ? (
        <View style={local.center}>
          <Text style={local.message}>Search for movies and TV shows</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={local.center}>
          <Text style={local.message}>No results found</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
          <FlatList
            data={filtered}
            numColumns={3}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            scrollEnabled={false}
            contentContainerStyle={local.grid}
            columnWrapperStyle={{ justifyContent: 'flex-start', gap: 12, marginBottom: 12 }}
            renderItem={({ item }) => (
              <View style={{ width: '31%' }}>
                <NetflixCard item={item} />
              </View>
            )}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
