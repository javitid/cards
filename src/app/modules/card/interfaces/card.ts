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
  apiKey: 'string',
  organization: 'string'
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