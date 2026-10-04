import { useAudioPlayer, type AudioSource } from 'expo-audio';
import * as Speech from 'expo-speech';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import type { WordCard } from './types';

/** If the recording has not started after this long, the phone's voice says the word instead. */
const RECORDING_TIMEOUT_MS = 2500;

// Wikimedia asks every client to identify itself and refuses requests without a User-Agent.
const RECORDING_HEADERS = { 'User-Agent': 'EnglishDaily/1.0 (Android app; expo-audio)' };

function recordingSource(url: string): AudioSource {
  // Browsers do not allow setting the User-Agent header and send their own.
  return Platform.OS === 'web' ? url : { uri: url, headers: RECORDING_HEADERS };
}

/**
 * Plays how a word or sentence sounds: the Wiktionary recording when the word has one,
 * otherwise (or if the recording fails to start) the phone's own text-to-speech voice.
 */
export function usePronunciation() {
  const player = useAudioPlayer();
  const cleanup = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanup.current?.(), []);

  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text, { language: 'en-US', rate: 0.9 });
  };

  const playWord = (word: Pick<WordCard, 'lemma' | 'audioUrl'>) => {
    cleanup.current?.();
    if (!word.audioUrl) {
      speak(word.lemma);
      return;
    }

    let started = false;
    let asked = false;
    // The player loads the file in the background: playing has to wait until it is loaded.
    const subscription = player.addListener('playbackStatusUpdate', (status) => {
      if (status.playing) {
        started = true;
      } else if (status.isLoaded && !asked) {
        asked = true;
        player.seekTo(0);
        player.play();
      }
    });
    const timer = setTimeout(() => {
      if (started) return;
      player.pause();
      speak(word.lemma);
    }, RECORDING_TIMEOUT_MS);
    cleanup.current = () => {
      subscription.remove();
      clearTimeout(timer);
      cleanup.current = null;
    };

    try {
      Speech.stop();
      player.replace(recordingSource(word.audioUrl));
      player.play();
    } catch {
      cleanup.current();
      speak(word.lemma);
    }
  };

  return { playWord, speak };
}
