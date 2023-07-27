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