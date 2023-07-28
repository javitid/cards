export interface Card {
  id: number;
  icon: string;
  pair: number;
  value: string;
  match?: boolean;
  selected?: boolean;
}

export interface CardResponse {
  documents: Card[];
}

// Helper to generate Cards
export interface Pair {
  icon: string;
  es: string;
  en: string;
}