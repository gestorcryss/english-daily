import { useAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

import type { WordCard } from './types';

/**
 * Plays how a word or sentence sounds: the Wiktionary recording when the word has one,
 * otherwise the phone's own text-to-speech voice.
 */
export function usePronunciation() {
  const player = useAudioPlayer();

  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text, { language: 'en-US', rate: 0.9 });
  };

  const playWord = (word: Pick<WordCard, 'lemma' | 'audioUrl'>) => {
    if (!word.audioUrl) {
      speak(word.lemma);
      return;
    }
    try {
      player.replace(word.audioUrl);
      player.play();
    } catch {
      speak(word.lemma);
    }
  };

  return { playWord, speak };
}
