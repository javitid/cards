import { AppGameId, GameLevelId, GameLevelOption, GameOption } from '../interfaces/card';

export const DEFAULT_CURRENT_LANGUAGE = 'gb';
export const DEFAULT_FLIP_EFFECT = true;
export const DEFAULT_SOUND = true;
export const DEFAULT_TWO_COLUMNS = true;
export const LANGUAGES = ['gb', 'it', 'pt', 'de'];
export const GAME_OPTIONS: GameOption[] = [
  {
    id: 'languages',
    label: 'Idiomas',
    description: 'Empareja una palabra en castellano con su traducción.',
    instructions: 'Empareja cada palabra con su traducción.',
    supportsLanguageSelection: true,
    defaultLanguage: 'gb'
  },
  {
    id: 'synonyms',
    label: 'Sinónimos',
    description: 'Encuentra las dos palabras que significan lo mismo.',
    instructions: 'Empareja cada palabra con su sinónimo.',
    supportsLanguageSelection: false,
    defaultLanguage: 'es'
  },
  {
    id: 'antonyms',
    label: 'Antónimos',
    description: 'Encuentra las dos palabras que significan lo contrario.',
    instructions: 'Empareja cada palabra con su antónimo.',
    supportsLanguageSelection: false,
    defaultLanguage: 'es'
  },
  {
    id: 'math',
    label: 'Matemáticas',
    description: 'Relaciona cada operación con su resultado.',
    instructions: 'Empareja cada operación con su resultado correcto.',
    supportsLanguageSelection: false,
    defaultLanguage: 'es'
  }
];
export const GAME_LEVELS: GameLevelOption[] = [
  { id: 'easy', label: 'Fácil', pairs: 5, timerSeconds: 60 },
  { id: 'medium', label: 'Medio', pairs: 7, timerSeconds: 75, timerSecondsByGame: { math: 150 } },
  { id: 'hard', label: 'Difícil', pairs: 9, timerSeconds: 90, timerSecondsByGame: { math: 240 } }
];
export const DEFAULT_GAME: AppGameId = 'languages';
export const DEFAULT_LEVEL: GameLevelId = 'easy';
export const LOCAL_STORAGE_KEYS = {
  CURRENT_GAME: 'currentGame',
  CURRENT_LANGUAGE: 'currentLanguage',
  LANGUAGES_GAME_LANGUAGE: 'languagesGameLanguage',
  CURRENT_LEVEL: 'currentLevel',
  SOUND: 'sound',
  FLIP_EFFECT: 'flipEffect'
};
