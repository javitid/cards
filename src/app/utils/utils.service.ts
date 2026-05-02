import { Injectable } from '@angular/core';
import { Card, LanguageCode, LanguagePair, SynonymPair } from '../modules/card/interfaces/card';

const BASE_LANGUAGE = 'es';
const LANGUAGE_VOICES: Record<LanguageCode, string> = {
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
  generateLanguageCards(pairs: LanguagePair[], targetLanguage: LanguageCode): Card[] {
    return pairs.flatMap((pair: LanguagePair, index) => {
      const firstId = index * 2;
      const secondId = firstId + 1;

      return [
        {
          id: firstId,
          groupId: index,
          icon: pair.icon,
          voice: LANGUAGE_VOICES[BASE_LANGUAGE],
          pairs: [secondId],
          value: pair.es,
          match: false,
          selected: false
        },
        {
          id: secondId,
          groupId: index,
          icon: pair.icon,
          voice: LANGUAGE_VOICES[targetLanguage],
          pairs: [firstId],
          value: pair[targetLanguage],
          match: false,
          selected: false
        }
      ];
    });
  }

  generateSynonymCards(pairs: SynonymPair[]): Card[] {
    return pairs.flatMap((pair: SynonymPair, index) => {
      const firstId = index * 2;
      const secondId = firstId + 1;

      return [
        {
          id: firstId,
          groupId: index,
          icon: pair.icon,
          voice: LANGUAGE_VOICES.es,
          pairs: [secondId],
          value: pair.left,
          match: false,
          selected: false
        },
        {
          id: secondId,
          groupId: index,
          icon: pair.icon,
          voice: LANGUAGE_VOICES.es,
          pairs: [firstId],
          value: pair.right,
          match: false,
          selected: false
        }
      ];
    });
  }
}
