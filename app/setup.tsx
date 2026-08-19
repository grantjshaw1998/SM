import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { openBrowserAsync } from 'expo-web-browser';
import { useApiKey } from '../../context/ApiKeyContext';
import { Colors } from '../../constants/Colors';

export default function SetupScreen() {
  const { setApiKey } = useApiKey();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!value.trim()) {
      setError('API key is required');
      return;
    }
    setError('');
    setApiKey(value.trim());
  };

  const handleGetKey = async () => {
    try {
      await openBrowserAsync('https://www.themoviedb.org/settings/api');
    } catch (e) {
      Alert.alert('Error', 'Could not open browser');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>STREAMFLIX</Text>
        <Text style={styles.subtitle}>Enter your TMDB API key to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Paste TMDB API Read Access Token"
          placeholderTextColor="#888"
          value={value}
          onChangeText={(t) => {
            setValue(t);
            if (error) setError('');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={handleContinue}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </Pressable>

        <Pressable style={styles.linkButton} onPress={handleGetKey}>
          <Text style={styles.linkText}>Get a free TMDB API key</Text>
        </Pressable>

        <Text style={styles.helper}>
          No key? Tap the link above, create a free TMDB account, request a
          Personal-use API key, copy the Read Access Token (starts with eyJ),
          and paste it here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#E50914',
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  error: {
    color: '#E50914',
    marginTop: 10,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#E50914',
    borderRadius: 6,
    paddingVertical: 14,
    marginTop: 20,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  linkText: {
    color: '#E50914',
    fontSize: 15,
    fontWeight: '600',
  },
  helper: {
    color: '#999',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 24,
    textAlign: 'center',
  },
});
