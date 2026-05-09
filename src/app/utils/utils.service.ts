import { Injectable } from '@angular/core';
import { BinaryPair, Card, CountryAssociationPair, FamilyPair, ImagePair, LanguageCode, LanguagePair } from '../modules/card/interfaces/card';

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
          contentType: 'text',
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
          contentType: 'text',
          match: false,
          selected: false
        }
      ];
    });
  }

  generateBinaryCards(pairs: BinaryPair[]): Card[] {
    return pairs.flatMap((pair: BinaryPair, index) => {
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
          contentType: 'text',
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
          contentType: 'text',
          match: false,
          selected: false
        }
      ];
    });
  }

  generateImageCards(pairs: ImagePair[]): Card[] {
    return pairs.flatMap((pair: ImagePair, index) => {
      const firstId = index * 2;
      const secondId = firstId + 1;
      const imageName = this.normalizeImageName(pair.image);
      const imagePath = this.getImagePath('memory-pairs', imageName);
      const label = this.humanizeImageName(imageName);

      return [
        {
          id: firstId,
          groupId: index,
          icon: '',
          voice: '',
          pairs: [secondId],
          value: label,
          contentType: 'image',
          imageName,
          imagePath,
          match: false,
          selected: false
        },
        {
          id: secondId,
          groupId: index,
          icon: '',
          voice: '',
          pairs: [firstId],
          value: label,
          contentType: 'image',
          imageName,
          imagePath,
          match: false,
          selected: false
        }
      ];
    });
  }

  generateFamilyCards(pairs: FamilyPair[]): Card[] {
    return pairs.flatMap((pair: FamilyPair, index) => {
      const firstId = index * 2;
      const secondId = firstId + 1;
      const familyName = this.humanizeImageName(pair.family);
      const leftImageName = this.normalizeImageName(pair.leftImage);
      const rightImageName = this.normalizeImageName(pair.rightImage);

      return [
        {
          id: firstId,
          groupId: index,
          icon: '',
          voice: '',
          pairs: [secondId],
          value: `${familyName}: ${this.humanizeImageName(leftImageName)}`,
          contentType: 'image',
          imageName: leftImageName,
          imagePath: this.getImagePath('memory-families', leftImageName),
          match: false,
          selected: false
        },
        {
          id: secondId,
          groupId: index,
          icon: '',
          voice: '',
          pairs: [firstId],
          value: `${familyName}: ${this.humanizeImageName(rightImageName)}`,
          contentType: 'image',
          imageName: rightImageName,
          imagePath: this.getImagePath('memory-families', rightImageName),
          match: false,
          selected: false
        }
      ];
    });
  }

  generateCountryCards(pairs: CountryAssociationPair[]): Card[] {
    return pairs.flatMap((pair: CountryAssociationPair, index) => {
      const firstId = index * 2;
      const secondId = firstId + 1;
      const flagName = this.normalizeImageName(pair.flag);
      const landmarkName = this.normalizeImageName(pair.landmark);

      return [
        {
          id: firstId,
          groupId: index,
          icon: '',
          voice: '',
          pairs: [secondId],
          value: `Bandera de ${pair.country}`,
          contentType: 'image',
          imageName: flagName,
          imagePath: this.getImagePath('memory-countries', flagName),
          match: false,
          selected: false
        },
        {
          id: secondId,
          groupId: index,
          icon: '',
          voice: '',
          pairs: [firstId],
          value: `${pair.country}: ${this.humanizeImageName(landmarkName)}`,
          contentType: 'image',
          imageName: landmarkName,
          imagePath: this.getImagePath('memory-countries', landmarkName),
          match: false,
          selected: false
        }
      ];
    });
  }

  private getImagePath(folder: 'memory-pairs' | 'memory-families' | 'memory-countries', imageName: string): string {
    return `assets/${folder}/${imageName}.svg`;
  }

  private normalizeImageName(imageName: string): string {
    return imageName.replace(/\.svg$/i, '').trim();
  }

  private humanizeImageName(imageName: string): string {
    return this.normalizeImageName(imageName)
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
