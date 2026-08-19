# StreamFlix

A Netflix-style Android client for streaming movies, series and anime, built with React Native (Expo). It ports the features of [Streambert](https://github.com/truelockmc/streambert) into a mobile Netflix UI and uses TMDB + AniList for metadata and in-app WebView players for playback.

## Features

- Netflix-style home: hero banner, horizontal rows (Trending Movies, Trending Series, Top Rated, Anime, Continue Watching)
- Search across movies & series (TMDB)
- Detail pages with cast, genres, overview, My List toggle
- TV season/episode picker
- In-app video playback via WebView (Videasy / VidSrc / VidKing sources) and AllManga for anime
- Local library: My List + Continue Watching (persisted on device)
- First-run API key gate: the app requires a free TMDB Read Access Token before it loads.

## First-run onboarding

On first launch the app asks for a **TMDB API Read Access Token** (free):

1. Create a free account at https://www.themoviedb.org/signup
2. Open https://www.themoviedb.org/settings/api and request a key (Personal use)
3. Copy the **API Read Access Token** (starts with `eyJ`)
4. Paste it into the app's setup screen and press Continue

The token is stored only on the device (AsyncStorage). No key is hardcoded.

## Build the APK

Prerequisites: Node >= 22, a Java JDK (17 or 21), and the Android SDK with `platform-34` and `build-tools;34.0.0`, with `ANDROID_HOME` set.

```bash
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`.

## Notes / limitations

- True video-file downloading (Streambert's native ffmpeg/CLI pipeline) is not available on Android; this app keeps a local **library** (My List + Continue Watching) instead.
- Streaming depends on third-party sources (Videasy, VidSrc, VidKing, AllManga) and requires an internet connection.
- This is an educational client and is not affiliated with Netflix or TMDB.
