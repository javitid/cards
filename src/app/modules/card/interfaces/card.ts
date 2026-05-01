export interface Card {
  id: number;
  icon: string;
  voice: string;
  pairs: number[];
  value: string;
  match?: boolean;
  selected?: boolean;
}

export interface CardResponse {
  documents: Pair[];
}

export interface Credentials {
  apiKey: string;
  organization: string;
}

export type GameLevelId = 'easy' | 'medium' | 'hard';

export interface GameLevelOption {
  id: GameLevelId;
  label: string;
  pairs: number;
  timerSeconds: number;
}

export interface ScoreEntry {
  id: string;
  playerName: string;
  durationSeconds: number;
  language: string;
  level: GameLevelId;
  createdAt: number;
  userId: string | null;
  isAnonymous: boolean;
}

export interface ScoreSubmission {
  playerName: string;
  durationSeconds: number;
  language: string;
  level: GameLevelId;
  userId: string | null;
  isAnonymous: boolean;
}

// Helper to generate Cards
export interface Pair {
  icon: string;
  es: string;
  gb: string;
  it: string;
  pt: string;
  de: string;
}
