import { AppGameId, GameLevelId, GameLevelOption, GameOption } from '../interfaces/card';

export const DEFAULT_CURRENT_LANGUAGE = 'gb';
export const DEFAULT_FLIP_EFFECT = true;
export const DEFAULT_SOUND = true;
export const DEFAULT_TWO_COLUMNS = true;
export const LANGUAGES = ['gb', 'it', 'pt', 'de'];
export const GAME_OPTIONS: GameOption[] = [
  {
    id: 'pairs',
    label: 'Parejas',
    description: 'Encuentra las dos cartas con la misma imagen.',
    instructions: 'Empareja cada imagen con su pareja idéntica.',
    supportsLanguageSelection: false,
    supportsColumnToggle: false,
    cardContent: 'image',
    defaultLanguage: 'es'
  },
  {
    id: 'families',
    label: 'Familias',
    description: 'Relaciona dos dibujos de la misma familia visual.',
    instructions: 'Empareja cada dibujo con otro de su misma familia, como fruta con fruta.',
    supportsLanguageSelection: false,
    supportsColumnToggle: false,
    cardContent: 'image',
    defaultLanguage: 'es'
  },
  {
    id: 'countries',
    label: 'Países',
    description: 'Relaciona cada bandera con un símbolo típico de ese país.',
    instructions: 'Empareja cada bandera con un dibujo representativo del mismo país.',
    supportsLanguageSelection: false,
    supportsColumnToggle: false,
    cardContent: 'image',
    defaultLanguage: 'es'
  },
  {
    id: 'shadows',
    label: 'Sombras',
    description: 'Relaciona cada dibujo con su silueta.',
    instructions: 'Empareja cada objeto con su sombra correcta.',
    supportsLanguageSelection: false,
    supportsColumnToggle: false,
    cardContent: 'image',
    defaultLanguage: 'es'
  },
  {
    id: 'languages',
    label: 'Idiomas',
    description: 'Empareja una palabra en castellano con su traducción.',
    instructions: 'Empareja cada palabra con su traducción.',
    supportsLanguageSelection: true,
    supportsColumnToggle: true,
    cardContent: 'text',
    defaultLanguage: 'gb'
  },
  {
    id: 'capitals',
    label: 'Capitales',
    description: 'Relaciona cada país con su capital.',
    instructions: 'Empareja cada país con su capital correcta.',
    supportsLanguageSelection: false,
    supportsColumnToggle: true,
    cardContent: 'text',
    defaultLanguage: 'es'
  },
  {
    id: 'communities',
    label: 'Comunidades',
    description: 'Relaciona cada comunidad autónoma con su capital.',
    instructions: 'Empareja cada comunidad con su capital autonómica.',
    supportsLanguageSelection: false,
    supportsColumnToggle: true,
    cardContent: 'text',
    defaultLanguage: 'es'
  },
  {
    id: 'instruments',
    label: 'Instrumentos',
    description: 'Relaciona cada instrumento con su sonido típico.',
    instructions: 'Empareja cada instrumento con el sonido que mejor lo representa.',
    supportsLanguageSelection: false,
    supportsColumnToggle: true,
    cardContent: 'text',
    defaultLanguage: 'es'
  },
  {
    id: 'professions',
    label: 'Profesiones',
    description: 'Relaciona cada profesión con su herramienta típica.',
    instructions: 'Empareja cada profesión con la herramienta que suele usar.',
    supportsLanguageSelection: false,
    supportsColumnToggle: true,
    cardContent: 'text',
    defaultLanguage: 'es'
  },
  {
    id: 'planets',
    label: 'Planetas',
    description: 'Relaciona cada planeta con una característica destacada.',
    instructions: 'Empareja cada planeta con su rasgo más reconocible.',
    supportsLanguageSelection: false,
    supportsColumnToggle: true,
    cardContent: 'text',
    defaultLanguage: 'es'
  },
  {
    id: 'synonyms',
    label: 'Sinónimos',
    description: 'Encuentra las dos palabras que significan lo mismo.',
    instructions: 'Empareja cada palabra con su sinónimo.',
    supportsLanguageSelection: false,
    supportsColumnToggle: true,
    cardContent: 'text',
    defaultLanguage: 'es'
  },
  {
    id: 'antonyms',
    label: 'Antónimos',
    description: 'Encuentra las dos palabras que significan lo contrario.',
    instructions: 'Empareja cada palabra con su antónimo.',
    supportsLanguageSelection: false,
    supportsColumnToggle: true,
    cardContent: 'text',
    defaultLanguage: 'es'
  },
  {
    id: 'math',
    label: 'Matemáticas',
    description: 'Relaciona cada operación con su resultado.',
    instructions: 'Empareja cada operación con su resultado correcto.',
    supportsLanguageSelection: false,
    supportsColumnToggle: true,
    cardContent: 'text',
    defaultLanguage: 'es'
  }
];
export const GAME_LEVELS: GameLevelOption[] = [
  {
    id: 'easy',
    label: 'Fácil',
    pairs: 5,
    timerSeconds: 60,
    pairsByGame: { pairs: 6, families: 6, countries: 6, shadows: 6 },
    timerSecondsByGame: { pairs: 75, families: 75, countries: 75, shadows: 75 },
    boardColumnsByGame: { pairs: 4, families: 4, countries: 4, shadows: 4 }
  },
  {
    id: 'medium',
    label: 'Medio',
    pairs: 7,
    timerSeconds: 75,
    pairsByGame: { pairs: 8, families: 8, countries: 8, shadows: 8 },
    timerSecondsByGame: { math: 150, pairs: 105, families: 105, countries: 105, shadows: 105 },
    boardColumnsByGame: { pairs: 4, families: 4, countries: 4, shadows: 4 }
  },
  {
    id: 'hard',
    label: 'Difícil',
    pairs: 9,
    timerSeconds: 90,
    pairsByGame: { pairs: 12, families: 12, countries: 12, shadows: 12 },
    timerSecondsByGame: { math: 240, pairs: 150, families: 150, countries: 150, shadows: 150 },
    boardColumnsByGame: { pairs: 6, families: 6, countries: 6, shadows: 6 }
  }
];
export const DEFAULT_GAME: AppGameId = 'pairs';
export const DEFAULT_LEVEL: GameLevelId = 'easy';
export const LOCAL_STORAGE_KEYS = {
  CURRENT_GAME: 'currentGame',
  CURRENT_LANGUAGE: 'currentLanguage',
  LANGUAGES_GAME_LANGUAGE: 'languagesGameLanguage',
  CURRENT_LEVEL: 'currentLevel',
  SOUND: 'sound',
  FLIP_EFFECT: 'flipEffect'
};
