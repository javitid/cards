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
    description: 'Empareja una palabra en castellano con su traduccion.',
    instructions: 'Empareja cada palabra con su traduccion.',
    supportsLanguageSelection: true,
    defaultLanguage: 'gb'
  },
  {
    id: 'synonyms',
    label: 'Sinonimos',
    description: 'Encuentra las dos palabras que significan lo mismo.',
    instructions: 'Empareja cada palabra con su sinonimo.',
    supportsLanguageSelection: false,
    defaultLanguage: 'es'
  },
  {
    id: 'antonyms',
    label: 'Antonimos',
    description: 'Encuentra las dos palabras que significan lo contrario.',
    instructions: 'Empareja cada palabra con su antonimo.',
    supportsLanguageSelection: false,
    defaultLanguage: 'es'
  }
];
export const GAME_LEVELS: GameLevelOption[] = [
  { id: 'easy', label: 'Facil', pairs: 5, timerSeconds: 60 },
  { id: 'medium', label: 'Medio', pairs: 7, timerSeconds: 75 },
  { id: 'hard', label: 'Dificil', pairs: 9, timerSeconds: 90 }
];
export const DEFAULT_GAME: AppGameId = 'languages';
export const DEFAULT_LEVEL: GameLevelId = 'easy';
export const LOCAL_STORAGE_KEYS = {
  CURRENT_GAME: 'currentGame',
  CURRENT_LANGUAGE: 'currentLanguage',
  CURRENT_LEVEL: 'currentLevel',
  SOUND: 'sound',
  FLIP_EFFECT: 'flipEffect'
};
