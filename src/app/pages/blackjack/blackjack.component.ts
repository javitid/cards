import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';

type RoundPhase = 'betting' | 'dealing' | 'insurance' | 'player-turn' | 'dealer-turn' | 'round-over';
type RoundOutcome = 'idle' | 'win' | 'lose' | 'push' | 'blackjack';
type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
type HandOutcome = 'pending' | 'win' | 'lose' | 'push' | 'blackjack';

interface BlackjackCard {
  id: string;
  rank: string;
  suit: Suit;
  value: number;
  hidden: boolean;
  fresh: boolean;
}

interface HandValue {
  total: number;
  isSoft: boolean;
}

interface PlayerHandState {
  id: string;
  cards: BlackjackCard[];
  bet: number;
  outcome: HandOutcome;
  wasSplitHand: boolean;
  finished: boolean;
}

const STARTING_CHIPS = 100;
const BET_OPTIONS = [10, 20, 50] as const;
const CARD_DEAL_DELAY_MS = 260;
const DEALER_PLAY_DELAY_MS = 420;
const BLACKJACK_PAYOUT = 2.5;
const REGULAR_PAYOUT = 2;
const PUSH_PAYOUT = 1;

@Component({
  selector: 'app-blackjack',
  standalone: false,
  templateUrl: './blackjack.component.html',
  styleUrls: ['./blackjack.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlackjackComponent implements OnDestroy {
  readonly betOptions = BET_OPTIONS;
  readonly chips = signal(STARTING_CHIPS);
  readonly selectedBet = signal<number>(BET_OPTIONS[0]);
  readonly currentBet = signal(0);
  readonly phase = signal<RoundPhase>('betting');
  readonly outcome = signal<RoundOutcome>('idle');
  readonly message = signal('Elige una apuesta y reparte para comenzar la partida.');
  readonly insuranceBet = signal(0);
  readonly playerHands = signal<PlayerHandState[]>([]);
  readonly activeHandIndex = signal(0);
  readonly dealerHand = signal<BlackjackCard[]>([]);
  readonly deckCount = signal(0);

  readonly activeHand = computed(() => this.playerHands()[this.activeHandIndex()] || null);
  readonly playerValue = computed(() => this.activeHand() ? this.calculateHandValue(this.activeHand()!.cards) : { total: 0, isSoft: false });
  readonly dealerVisibleValue = computed(() => this.calculateHandValue(this.dealerHand().filter((card) => !card.hidden)));
  readonly dealerFinalValue = computed(() => this.calculateHandValue(this.dealerHand().map((card) => ({ ...card, hidden: false }))));
  readonly canDeal = computed(() => (this.phase() === 'betting' || this.phase() === 'round-over') && this.chips() >= this.selectedBet());
  readonly canHit = computed(() => this.phase() === 'player-turn' && !!this.activeHand());
  readonly canStand = computed(() => this.phase() === 'player-turn' && !!this.activeHand());
  readonly canDouble = computed(() => {
    const hand = this.activeHand();

    return this.phase() === 'player-turn'
      && !!hand
      && hand.cards.length === 2
      && !hand.finished
      && this.chips() >= hand.bet;
  });
  readonly canTakeInsurance = computed(() => this.phase() === 'insurance' && this.insuranceBet() === 0 && this.chips() >= this.insuranceCost());
  readonly insuranceCost = computed(() => Math.floor(this.currentBet() / 2));
  readonly canSplit = computed(() => {
    const hand = this.activeHand();

    return this.phase() === 'player-turn'
      && this.playerHands().length === 1
      && !!hand
      && hand.cards.length === 2
      && hand.cards[0].value === hand.cards[1].value
      && this.chips() >= hand.bet;
  });
  readonly isRoundActive = computed(() => this.phase() !== 'betting' && this.phase() !== 'round-over');
  readonly isBroke = computed(() => this.chips() <= 0 && !this.isRoundActive());
  readonly canRecover = computed(() => this.isBroke() || this.phase() === 'round-over');

  private deck: BlackjackCard[] = [];
  private drawIndex = 0;
  private timeoutIds: number[] = [];
  private sequence = 0;

  ngOnDestroy(): void {
    this.clearScheduledActions();
  }

  selectBet(amount: number): void {
    if (this.isRoundActive()) {
      return;
    }

    this.selectedBet.set(amount);
  }

  dealRound(): void {
    if (!this.canDeal()) {
      if (this.chips() < this.selectedBet()) {
        this.message.set('No tienes suficientes fichas para esa apuesta.');
      }

      return;
    }

    this.clearScheduledActions();
    this.prepareDeck();
    this.outcome.set('idle');
    this.phase.set('dealing');
    this.message.set('Repartiendo cartas...');
    this.currentBet.set(this.selectedBet());
    this.chips.set(this.chips() - this.selectedBet());
    this.activeHandIndex.set(0);
    this.insuranceBet.set(0);
    this.playerHands.set([this.createPlayerHand('main', this.selectedBet())]);
    this.dealerHand.set([]);

    this.dealInitialCards();
  }

  hit(): void {
    const hand = this.activeHand();

    if (!this.canHit() || !hand) {
      return;
    }

    this.phase.set('dealing');
    this.message.set(`Pides una carta para ${this.handDisplayName(this.activeHandIndex())}.`);
    this.dealCardToPlayerHand(this.activeHandIndex(), () => {
      const nextHand = this.playerHands()[this.activeHandIndex()];
      const handValue = this.calculateHandValue(nextHand.cards).total;

      if (handValue > 21) {
        this.markHandOutcome(this.activeHandIndex(), 'lose', true);
        this.message.set(`${this.handDisplayName(this.activeHandIndex())} se ha pasado.`);
        this.advanceAfterPlayerAction();
        return;
      }

      if (handValue === 21) {
        this.markHandFinished(this.activeHandIndex());
        this.advanceAfterPlayerAction();
        return;
      }

      this.phase.set('player-turn');
      this.message.set(`Turno de ${this.handDisplayName(this.activeHandIndex())}. Puedes pedir otra carta o plantarte.`);
    });
  }

  stand(): void {
    if (!this.canStand()) {
      return;
    }

    this.markHandFinished(this.activeHandIndex());
    this.message.set(`${this.handDisplayName(this.activeHandIndex())} se planta.`);
    this.advanceAfterPlayerAction();
  }

  split(): void {
    const hand = this.activeHand();

    if (!this.canSplit() || !hand) {
      return;
    }

    this.phase.set('dealing');
    this.message.set('Dividiendo la jugada y colocando una apuesta adicional.');
    this.chips.set(this.chips() - hand.bet);
    this.currentBet.set(this.currentBet() + hand.bet);

    const [firstCard, secondCard] = hand.cards;
    const splitHands: PlayerHandState[] = [
      this.createPlayerHand('split-1', hand.bet, [{ ...firstCard, fresh: false }], true),
      this.createPlayerHand('split-2', hand.bet, [{ ...secondCard, fresh: false }], true)
    ];

    this.playerHands.set(splitHands);
    this.activeHandIndex.set(0);

    this.dealCardToPlayerHand(0);
    this.schedule(() => this.dealCardToPlayerHand(1), CARD_DEAL_DELAY_MS);
    this.schedule(() => {
      this.activeHandIndex.set(0);
      this.phase.set('player-turn');
      this.message.set('Jugada dividida. Empieza por la mano 1.');
      this.autoAdvanceFinishedHands();
    }, CARD_DEAL_DELAY_MS * 2 + 60);
  }

  doubleDown(): void {
    const hand = this.activeHand();

    if (!this.canDouble() || !hand) {
      return;
    }

    this.phase.set('dealing');
    this.message.set(`Doblas en ${this.handDisplayName(this.activeHandIndex())}. Recibes una sola carta.`);
    this.chips.set(this.chips() - hand.bet);
    this.currentBet.set(this.currentBet() + hand.bet);
    this.playerHands.update((hands) =>
      hands.map((currentHand, index) =>
        index === this.activeHandIndex()
          ? { ...currentHand, bet: currentHand.bet * 2 }
          : currentHand
      )
    );

    this.dealCardToPlayerHand(this.activeHandIndex(), () => {
      const nextHand = this.playerHands()[this.activeHandIndex()];
      const handValue = this.calculateHandValue(nextHand.cards).total;

      if (handValue > 21) {
        this.markHandOutcome(this.activeHandIndex(), 'lose', true);
        this.message.set(`${this.handDisplayName(this.activeHandIndex())} se pasa al doblar.`);
      } else {
        this.markHandFinished(this.activeHandIndex());
      }

      this.advanceAfterPlayerAction();
    });
  }

  takeInsurance(): void {
    if (!this.canTakeInsurance()) {
      return;
    }

    this.insuranceBet.set(this.insuranceCost());
    this.chips.set(this.chips() - this.insuranceCost());
    this.currentBet.set(this.currentBet() + this.insuranceCost());
    this.message.set('Seguro tomado. La banca comprueba blackjack.');
    this.resolveDealerPeek();
  }

  declineInsurance(): void {
    if (this.phase() !== 'insurance') {
      return;
    }

    this.message.set('Sin seguro. La banca comprueba blackjack.');
    this.resolveDealerPeek();
  }

  resetSession(): void {
    this.clearScheduledActions();
    this.deck = [];
    this.drawIndex = 0;
    this.sequence = 0;
    this.chips.set(STARTING_CHIPS);
    this.currentBet.set(0);
    this.insuranceBet.set(0);
    this.playerHands.set([]);
    this.activeHandIndex.set(0);
    this.dealerHand.set([]);
    this.phase.set('betting');
    this.outcome.set('idle');
    this.message.set('La mesa se reinició. Tienes 100 fichas para volver a jugar.');
    this.deckCount.set(0);
  }

  suitSymbol(card: BlackjackCard): string {
    switch (card.suit) {
      case 'spades':
        return '♠';
      case 'hearts':
        return '♥';
      case 'diamonds':
        return '♦';
      case 'clubs':
      default:
        return '♣';
    }
  }

  suitColor(card: BlackjackCard): 'red' | 'black' {
    return card.suit === 'hearts' || card.suit === 'diamonds' ? 'red' : 'black';
  }

  handLabel(value: HandValue): string {
    return value.isSoft && value.total <= 21 ? `${value.total} suave` : `${value.total}`;
  }

  handValueFor(hand: PlayerHandState): HandValue {
    return this.calculateHandValue(hand.cards);
  }

  handDisplayName(index: number): string {
    return this.playerHands().length > 1 ? `mano ${index + 1}` : 'tu mano';
  }

  handBadge(index: number, hand: PlayerHandState): string {
    if (hand.outcome === 'blackjack') {
      return 'Blackjack';
    }

    if (hand.outcome === 'win') {
      return 'Ganada';
    }

    if (hand.outcome === 'lose') {
      return 'Perdida';
    }

    if (hand.outcome === 'push') {
      return 'Empate';
    }

    if (this.phase() === 'player-turn' && index === this.activeHandIndex()) {
      return 'Activa';
    }

    if (hand.finished) {
      return 'Plantada';
    }

    return 'Pendiente';
  }

  private dealInitialCards(): void {
    this.dealCardToPlayerHand(0);
    this.schedule(() => this.dealCardToDealer(), CARD_DEAL_DELAY_MS);
    this.schedule(() => this.dealCardToPlayerHand(0), CARD_DEAL_DELAY_MS * 2);
    this.schedule(() => this.dealCardToDealer(true), CARD_DEAL_DELAY_MS * 3);
    this.schedule(() => this.finishInitialDeal(), CARD_DEAL_DELAY_MS * 4 + 80);
  }

  private finishInitialDeal(): void {
    if (this.isInsuranceOfferAvailable()) {
      this.phase.set('insurance');
      this.message.set('La banca muestra un As. Puedes tomar seguro o continuar sin seguro.');
      return;
    }

    this.resolveDealerPeek();
  }

  private resolveDealerPeek(): void {
    const playerCards = this.playerHands()[0]?.cards || [];
    const playerTotal = this.calculateHandValue(playerCards).total;
    const dealerTotal = this.calculateHandValue(this.dealerHand().map((card) => ({ ...card, hidden: false }))).total;
    const hadInsurance = this.insuranceBet() > 0;

    if (playerTotal === 21 || dealerTotal === 21) {
      this.revealDealerHand(() => {
        if (dealerTotal === 21 && hadInsurance) {
          this.chips.set(this.chips() + (this.insuranceBet() * 3));
        }

        if (playerTotal === 21 && dealerTotal === 21) {
          this.markHandOutcome(0, 'push', true);
          this.payoutHand(this.playerHands()[0], PUSH_PAYOUT);
          this.finishRound('push', hadInsurance ? 'Empate: ambos tenéis blackjack. El seguro compensa la mano principal.' : 'Empate: ambos tenéis blackjack.');
          return;
        }

        if (playerTotal === 21) {
          this.markHandOutcome(0, 'blackjack', true);
          this.payoutHand(this.playerHands()[0], BLACKJACK_PAYOUT);
          this.finishRound('blackjack', hadInsurance ? '¡Blackjack! Cobras 3:2. El seguro se pierde.' : '¡Blackjack! Cobras 3:2.');
          return;
        }

        this.markHandOutcome(0, 'lose', true);
        this.finishRound('lose', hadInsurance ? 'La banca tiene blackjack, pero cobras el seguro 2:1.' : 'La banca tiene blackjack.');
      });
      return;
    }

    if (hadInsurance) {
      this.currentBet.set(this.currentBet() - this.insuranceBet());
      this.insuranceBet.set(0);
    }

    this.phase.set('player-turn');
    this.message.set(hadInsurance
      ? 'La banca no tiene blackjack. Pierdes el seguro. Tu turno.'
      : 'Tu turno. Pide carta, plántate o divide si tienes pareja.');
  }

  private runDealerTurn(): void {
    const dealerValue = this.dealerFinalValue();

    if (dealerValue.total < 17) {
      this.message.set('La banca pide carta.');
      this.dealCardToDealer(false, () => {
        if (this.dealerFinalValue().total > 21) {
          this.resolveAllHands();
          return;
        }

        this.schedule(() => this.runDealerTurn(), DEALER_PLAY_DELAY_MS);
      });
      return;
    }

    this.resolveAllHands();
  }

  private resolveAllHands(): void {
    const dealerTotal = this.dealerFinalValue().total;
    const resolvedHands = this.playerHands().map((hand): PlayerHandState => {
      const total = this.calculateHandValue(hand.cards).total;

      if (hand.outcome === 'blackjack') {
        return hand;
      }

      if (total > 21) {
        return { ...hand, outcome: 'lose', finished: true };
      }

      if (dealerTotal > 21 || total > dealerTotal) {
        this.payoutHand(hand, REGULAR_PAYOUT);
        return { ...hand, outcome: 'win', finished: true };
      }

      if (total < dealerTotal) {
        return { ...hand, outcome: 'lose', finished: true };
      }

      this.payoutHand(hand, PUSH_PAYOUT);
      return { ...hand, outcome: 'push', finished: true };
    });

    this.playerHands.set(resolvedHands);
    this.finishRound(this.summarizeRoundOutcome(resolvedHands), this.buildRoundMessage(resolvedHands));
  }

  private summarizeRoundOutcome(hands: PlayerHandState[]): RoundOutcome {
    const outcomes = hands.map((hand) => hand.outcome);

    if (outcomes.every((outcome) => outcome === 'blackjack')) {
      return 'blackjack';
    }

    if (outcomes.every((outcome) => outcome === 'win' || outcome === 'blackjack')) {
      return 'win';
    }

    if (outcomes.every((outcome) => outcome === 'lose')) {
      return 'lose';
    }

    return 'push';
  }

  private buildRoundMessage(hands: PlayerHandState[]): string {
    if (hands.length === 1) {
      switch (hands[0].outcome) {
        case 'blackjack':
          return '¡Blackjack! Cobras 3:2.';
        case 'win':
          return 'Tu mano es mejor. Ganas la apuesta.';
        case 'lose':
          return 'La banca gana la mano.';
        case 'push':
          return 'Empate. Recuperas tu apuesta.';
        default:
          return 'La ronda terminó.';
      }
    }

    const wins = hands.filter((hand) => hand.outcome === 'win' || hand.outcome === 'blackjack').length;
    const pushes = hands.filter((hand) => hand.outcome === 'push').length;
    const losses = hands.filter((hand) => hand.outcome === 'lose').length;

    return `Ronda terminada: ${wins} ganadas, ${pushes} empatadas y ${losses} perdidas.`;
  }

  private finishRound(outcome: RoundOutcome, message: string): void {
    this.outcome.set(outcome);
    this.phase.set('round-over');
    this.message.set(this.chips() <= 0 ? 'Te quedaste sin fichas. Reinicia la mesa para volver a 100.' : message);
    this.currentBet.set(0);
    this.insuranceBet.set(0);
  }

  private isInsuranceOfferAvailable(): boolean {
    if (this.playerHands().length !== 1) {
      return false;
    }

    const dealerCards = this.dealerHand();
    if (dealerCards.length < 2) {
      return false;
    }

    return dealerCards[0].rank === 'A';
  }

  private revealDealerHand(callback?: () => void): void {
    const hiddenCardIndex = this.dealerHand().findIndex((card) => card.hidden);

    if (hiddenCardIndex === -1) {
      callback?.();
      return;
    }

    this.dealerHand.update((cards) =>
      cards.map((card, index) =>
        index === hiddenCardIndex
          ? { ...card, hidden: false, fresh: true }
          : card
      )
    );

    this.schedule(() => {
      this.clearFreshFlag('dealer', hiddenCardIndex);
      callback?.();
    }, 260);
  }

  private dealCardToPlayerHand(handIndex: number, callback?: () => void): void {
    const card = this.drawCard(false);

    this.playerHands.update((hands) =>
      hands.map((hand, index) =>
        index === handIndex
          ? { ...hand, cards: [...hand.cards, card] }
          : hand
      )
    );

    this.deckCount.set(this.deck.length - this.drawIndex);

    const dealtIndex = this.playerHands()[handIndex]?.cards.length - 1;
    this.schedule(() => {
      this.clearFreshFlag('player', dealtIndex, handIndex);
      callback?.();
    }, 250);
  }

  private dealCardToDealer(hidden = false, callback?: () => void): void {
    const card = this.drawCard(hidden);

    this.dealerHand.update((cards) => [...cards, card]);
    this.deckCount.set(this.deck.length - this.drawIndex);

    const dealtIndex = this.dealerHand().length - 1;
    this.schedule(() => {
      this.clearFreshFlag('dealer', dealtIndex);
      callback?.();
    }, 250);
  }

  private clearFreshFlag(owner: 'player' | 'dealer', cardIndex: number, handIndex = 0): void {
    if (owner === 'dealer') {
      this.dealerHand.update((cards) =>
        cards.map((card, index) =>
          index === cardIndex
            ? { ...card, fresh: false }
            : card
        )
      );
      return;
    }

    this.playerHands.update((hands) =>
      hands.map((hand, index) =>
        index === handIndex
          ? {
              ...hand,
              cards: hand.cards.map((card, currentCardIndex) =>
                currentCardIndex === cardIndex
                  ? { ...card, fresh: false }
                  : card
              )
            }
          : hand
      )
    );
  }

  private drawCard(hidden: boolean): BlackjackCard {
    const baseCard = this.deck[this.drawIndex];
    this.drawIndex += 1;

    return {
      ...baseCard,
      hidden,
      fresh: true
    };
  }

  private prepareDeck(): void {
    if (this.deck.length - this.drawIndex >= 20) {
      this.deckCount.set(this.deck.length - this.drawIndex);
      return;
    }

    this.deck = this.shuffleDeck(this.createDeck());
    this.drawIndex = 0;
    this.deckCount.set(this.deck.length);
  }

  private createDeck(): BlackjackCard[] {
    const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    const ranks = [
      { rank: 'A', value: 11 },
      { rank: '2', value: 2 },
      { rank: '3', value: 3 },
      { rank: '4', value: 4 },
      { rank: '5', value: 5 },
      { rank: '6', value: 6 },
      { rank: '7', value: 7 },
      { rank: '8', value: 8 },
      { rank: '9', value: 9 },
      { rank: '10', value: 10 },
      { rank: 'J', value: 10 },
      { rank: 'Q', value: 10 },
      { rank: 'K', value: 10 }
    ];

    return suits.flatMap((suit) =>
      ranks.map(({ rank, value }) => ({
        id: `${suit}-${rank}-${this.sequence++}`,
        rank,
        suit,
        value,
        hidden: false,
        fresh: false
      }))
    );
  }

  private shuffleDeck(deck: BlackjackCard[]): BlackjackCard[] {
    const shuffled = [...deck];

    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled;
  }

  private calculateHandValue(cards: BlackjackCard[]): HandValue {
    const visibleCards = cards.filter((card) => !card.hidden);
    let total = visibleCards.reduce((sum, card) => sum + card.value, 0);
    let aces = visibleCards.filter((card) => card.rank === 'A').length;

    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }

    return {
      total,
      isSoft: aces > 0
    };
  }

  private advanceAfterPlayerAction(): void {
    if (this.autoAdvanceFinishedHands()) {
      return;
    }

    this.phase.set('player-turn');
    this.message.set(`Turno de ${this.handDisplayName(this.activeHandIndex())}. Puedes pedir carta o plantarte.`);
  }

  private autoAdvanceFinishedHands(): boolean {
    const hands = this.playerHands();
    const nextIndex = hands.findIndex((hand, index) => index >= this.activeHandIndex() && !hand.finished && this.calculateHandValue(hand.cards).total <= 21);

    if (nextIndex !== -1) {
      this.activeHandIndex.set(nextIndex);
      return false;
    }

    const hasPlayableHand = hands.some((hand) => this.calculateHandValue(hand.cards).total <= 21);

    if (!hasPlayableHand) {
      this.revealDealerHand(() => this.finishRound('lose', 'Todas tus manos se pasaron. La banca gana.'));
      return true;
    }

    this.phase.set('dealer-turn');
    this.message.set('La banca destapa y juega.');
    this.revealDealerHand(() => this.runDealerTurn());
    return true;
  }

  private createPlayerHand(id: string, bet: number, cards: BlackjackCard[] = [], wasSplitHand = false): PlayerHandState {
    return {
      id,
      cards,
      bet,
      outcome: 'pending',
      wasSplitHand,
      finished: false
    };
  }

  private payoutHand(hand: PlayerHandState, multiplier: number): void {
    this.chips.set(this.chips() + (hand.bet * multiplier));
  }

  private markHandOutcome(handIndex: number, outcome: HandOutcome, finished = true): void {
    this.playerHands.update((hands) =>
      hands.map((hand, index) =>
        index === handIndex
          ? { ...hand, outcome, finished }
          : hand
      )
    );
  }

  private markHandFinished(handIndex: number): void {
    this.playerHands.update((hands) =>
      hands.map((hand, index) =>
        index === handIndex
          ? { ...hand, finished: true }
          : hand
      )
    );
  }

  private schedule(callback: () => void, delayMs: number): void {
    const timeoutId = window.setTimeout(() => {
      this.timeoutIds = this.timeoutIds.filter((currentId) => currentId !== timeoutId);
      callback();
    }, delayMs);

    this.timeoutIds.push(timeoutId);
  }

  private clearScheduledActions(): void {
    this.timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    this.timeoutIds = [];
  }
}
