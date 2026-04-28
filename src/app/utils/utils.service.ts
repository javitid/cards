import { Injectable } from '@angular/core';
import { Card, Pair } from '../modules/card/interfaces/card';

const BASE_LANGUAGE = 'es';
const LANGUAGE_VOICES: Record<string, string> = {
  es: 'es-ES',
  gb: 'en-GB',
  it: 'it-IT',
  pt: 'pt-PT',
  de: 'de-DE',
};

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  generateCards(pairs: Pair[], languages: string[]): Card[] {
    const supportedLanguages = [BASE_LANGUAGE, ...languages];
    const cardsForEachPair = supportedLanguages.length;

    return pairs.flatMap((pair: Pair, index) => {
      const baseId = cardsForEachPair * index;

      return supportedLanguages.map((language, languageIndex) => ({
        id: baseId + languageIndex,
        icon: pair.icon,
        voice: LANGUAGE_VOICES[language],
        pairs: supportedLanguages
          .map((_, pairIndex) => baseId + pairIndex)
          .filter((pairId) => pairId !== baseId + languageIndex),
        value: pair[language as keyof Pair],
        match: false,
        selected: false
      }));
    });
  }
}
