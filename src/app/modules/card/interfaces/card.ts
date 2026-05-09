export interface Card {
  id: number;
  groupId: number;
  icon: string;
  voice: string;
  pairs: number[];
  value: string;
  contentType?: 'text' | 'image';
  imageName?: string;
  imagePath?: string;
  match?: boolean;
  selected?: boolean;
}

export interface CardResponse {
  documents: Array<LanguagePair | BinaryPair>;
}

export interface Credentials {
  apiKey: string;
  organization: string;
}

export type AppGameId = 'languages' | 'synonyms' | 'antonyms' | 'math' | 'pairs' | 'families';
export type GameLevelId = 'easy' | 'medium' | 'hard';
export type LanguageCode = 'es' | 'gb' | 'it' | 'pt' | 'de';

export interface GameOption {
  id: AppGameId;
  label: string;
  description: string;
  instructions: string;
  supportsLanguageSelection: boolean;
  supportsColumnToggle: boolean;
  cardContent: 'text' | 'image';
  defaultLanguage: LanguageCode;
}

export interface GameLevelOption {
  id: GameLevelId;
  label: string;
  pairs: number;
  timerSeconds: number;
  pairsByGame?: Partial<Record<AppGameId, number>>;
  timerSecondsByGame?: Partial<Record<AppGameId, number>>;
  boardColumnsByGame?: Partial<Record<AppGameId, number>>;
}

export interface ScoreEntry {
  id: string;
  gameId: AppGameId;
  playerName: string;
  durationSeconds: number;
  language: string;
  level: GameLevelId;
  createdAt: number;
  userId: string | null;
  isAnonymous: boolean;
}

export interface ScoreSubmission {
  gameId: AppGameId;
  playerName: string;
  durationSeconds: number;
  language: string;
  level: GameLevelId;
  userId: string | null;
  isAnonymous: boolean;
}

export interface LanguagePair {
  icon: string;
  es: string;
  gb: string;
  it: string;
  pt: string;
  de: string;
}

export interface BinaryPair {
  icon: string;
  left: string;
  right: string;
}

export interface ImagePair {
  image: string;
}

export interface FamilyPair {
  family: string;
  leftImage: string;
  rightImage: string;
}

export type SynonymPair = BinaryPair;
export type AntonymPair = BinaryPair;
export type MathPair = BinaryPair;
