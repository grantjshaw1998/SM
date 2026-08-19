import AsyncStorage from '@react-native-async-storage/async-storage';

export const MY_LIST_KEY = "streamflix_mylist";
export const CW_KEY = "streamflix_continue";

const _listKey = (id: any, media_type: string) => `${media_type}_${id}`;

async function readArray(key: string): Promise<any[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function writeArray(key: string, value: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('writeArray failed', key, e);
  }
}

export const getMyList = async (): Promise<any[]> => readArray(MY_LIST_KEY);

export const addToMyList = async (item: any): Promise<void> => {
  try {
    const list = await readArray(MY_LIST_KEY);
    const id = item?.id;
    const media_type = item?.media_type;
    const key = _listKey(id, media_type);
    if (list.some((x) => _listKey(x?.id, x?.media_type) === key)) return;
    list.unshift(item);
    await writeArray(MY_LIST_KEY, list);
  } catch (e) {
    console.warn('addToMyList failed', e);
  }
};

export const removeFromMyList = async (
  id: string,
  media_type: string,
): Promise<void> => {
  try {
    const list = await readArray(MY_LIST_KEY);
    const key = _listKey(id, media_type);
    const next = list.filter(
      (x) => _listKey(x?.id, x?.media_type) !== key,
    );
    await writeArray(MY_LIST_KEY, next);
  } catch (e) {
    console.warn('removeFromMyList failed', e);
  }
};

export const isInMyList = async (
  id: string,
  media_type: string,
): Promise<boolean> => {
  try {
    const list = await readArray(MY_LIST_KEY);
    const key = _listKey(id, media_type);
    return list.some((x) => _listKey(x?.id, x?.media_type) === key);
  } catch {
    return false;
  }
};

export const getContinueWatching = async (): Promise<any[]> =>
  readArray(CW_KEY);

export const setProgress = async (item: any): Promise<void> => {
  try {
    const list = await readArray(CW_KEY);
    const id = item?.id;
    const media_type = item?.media_type;
    const key = _listKey(id, media_type);
    const stored = {
      id,
      media_type,
      title: item?.title,
      poster_path: item?.poster_path,
      season: item?.season,
      episode: item?.episode,
      progress: item?.progress,
      updatedAt: Date.now(),
    };
    const next = list.filter(
      (x) => _listKey(x?.id, x?.media_type) !== key,
    );
    next.unshift(stored);
    await writeArray(CW_KEY, next);
  } catch (e) {
    console.warn('setProgress failed', e);
  }
};

export const clearProgress = async (
  id: string,
  media_type: string,
): Promise<void> => {
  try {
    const list = await readArray(CW_KEY);
    const key = _listKey(id, media_type);
    const next = list.filter(
      (x) => _listKey(x?.id, x?.media_type) !== key,
    );
    await writeArray(CW_KEY, next);
  } catch (e) {
    console.warn('clearProgress failed', e);
  }
};
