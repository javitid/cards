export interface Card {
  id: number;
  icon: string;
  pairs: number[];
  value: string;
  match?: boolean;
  selected?: boolean;
}

export interface CardResponse {
  documents: Pair[];
}

export interface Credentials {
  apiKey: 'string',
  organization: 'string'
}

// Helper to generate Cards
export interface Pair {
  icon: string;
  es: string;
  en: string;
  it: string;
}