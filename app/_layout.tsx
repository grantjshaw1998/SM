import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ApiKeyProvider, useApiKey } from '../../context/ApiKeyContext';
import { Colors } from '../../constants/Colors';

function RootNavigator() {
  const { apiKey, ready } = useApiKey();

  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.tint} />
      </View>
    );
  }

  if (!apiKey) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="setup" />
      </Stack>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="setup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="detail/[id]" />
      <Stack.Screen name="player" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ApiKeyProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <RootNavigator />
      </View>
    </ApiKeyProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
