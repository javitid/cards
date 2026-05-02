export interface Card {
  id: number;
  groupId: number;
  icon: string;
  voice: string;
  pairs: number[];
  value: string;
  match?: boolean;
  selected?: boolean;
}

export interface CardResponse {
  documents: Array<LanguagePair | SynonymPair | AntonymPair>;
}

export interface Credentials {
  apiKey: string;
  organization: string;
}

export type AppGameId = 'languages' | 'synonyms' | 'antonyms';
export type GameLevelId = 'easy' | 'medium' | 'hard';
export type LanguageCode = 'es' | 'gb' | 'it' | 'pt' | 'de';

export interface GameOption {
  id: AppGameId;
  label: string;
  description: string;
  instructions: string;
  supportsLanguageSelection: boolean;
  defaultLanguage: LanguageCode;
}

export interface GameLevelOption {
  id: GameLevelId;
  label: string;
  pairs: number;
  timerSeconds: number;
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

export interface SynonymPair {
  icon: string;
  left: string;
  right: string;
}

export interface AntonymPair {
  icon: string;
  left: string;
  right: string;
}
