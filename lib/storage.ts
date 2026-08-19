import AsyncStorage from '@react-native-async-storage/async-storage';

export const TMDB_TOKEN_KEY = 'streamflix_tmdb_token';
export const TMDB_LANG_KEY = 'streamflix_tmdbLang';

export const getApiKey = async (): Promise<string | null> => {
  try {
    const raw = await AsyncStorage.getItem(TMDB_TOKEN_KEY);
    return raw ? raw : null;
  } catch {
    return null;
  }
};

export const setApiKey = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TMDB_TOKEN_KEY, key);
  } catch (e) {
    console.warn('setApiKey failed', e);
  }
};

export const clearApiKey = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TMDB_TOKEN_KEY);
  } catch (e) {
    console.warn('clearApiKey failed', e);
  }
};

export const getTmdbLanguage = async (): Promise<string> => {
  try {
    const raw = await AsyncStorage.getItem(TMDB_LANG_KEY);
    return raw ? raw : 'en-US';
  } catch {
    return 'en-US';
  }
};

export const setTmdbLanguage = async (lang: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TMDB_LANG_KEY, lang);
  } catch (e) {
    console.warn('setTmdbLanguage failed', e);
  }
};
