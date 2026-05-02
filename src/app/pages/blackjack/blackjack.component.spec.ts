import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlackjackComponent } from './blackjack.component';

describe('BlackjackComponent', () => {
  let component: BlackjackComponent;
  let fixture: ComponentFixture<BlackjackComponent>;

  const makeCard = (id: string, rank: string, value: number, suit = 'spades') => ({
    id,
    rank,
    suit,
    value,
    hidden: false,
    fresh: false
  });

  const setDeck = (...cards: ReturnType<typeof makeCard>[]) => {
    const filler = Array.from({ length: 30 }, (_, index) => makeCard(`filler-${index}`, '9', 9, 'clubs'));
    (component as any).deck = [...cards, ...filler];
    (component as any).drawIndex = 0;
  };

  beforeEach(async () => {
    jest.useFakeTimers();

    await TestBed.configureTestingModule({
      declarations: [BlackjackComponent]
    })
      .overrideComponent(BlackjackComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(BlackjackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.chips()).toBe(100);
  });

  it('should deal two cards to player and dealer and deduct the bet', () => {
    setDeck(
      makeCard('p-1', '9', 9, 'hearts'),
      makeCard('d-1', '7', 7, 'spades'),
      makeCard('p-2', '8', 8, 'clubs'),
      makeCard('d-2', '6', 6, 'diamonds')
    );

    component.dealRound();
    jest.advanceTimersByTime(2000);

    expect(component.playerHands()).toHaveLength(1);
    expect(component.playerHands()[0].cards).toHaveLength(2);
    expect(component.dealerHand()).toHaveLength(2);
    expect(component.chips()).toBe(90);
  });

  it('should reset the table back to the starting chips', () => {
    setDeck(
      makeCard('p-1', '9', 9, 'hearts'),
      makeCard('d-1', '7', 7, 'spades'),
      makeCard('p-2', '8', 8, 'clubs'),
      makeCard('d-2', '6', 6, 'diamonds')
    );

    component.dealRound();
    jest.advanceTimersByTime(2000);

    component.resetSession();

    expect(component.chips()).toBe(100);
    expect(component.playerHands()).toHaveLength(0);
    expect(component.dealerHand()).toHaveLength(0);
    expect(component.phase()).toBe('betting');
  });

  it('should allow splitting a pair into two hands with one extra card each', () => {
    component.chips.set(90);
    component.currentBet.set(10);
    component.phase.set('player-turn');
    component.playerHands.set([
      {
        id: 'main',
        bet: 10,
        outcome: 'pending',
        wasSplitHand: false,
        finished: false,
        cards: [
          makeCard('first', '8', 8, 'hearts'),
          makeCard('second', '8', 8, 'clubs')
        ]
      }
    ] as never[]);

    (component as any).deck = [
      makeCard('draw-1', '3', 3, 'diamonds'),
      makeCard('draw-2', 'K', 10, 'spades')
    ];
    (component as any).drawIndex = 0;

    expect(component.canSplit()).toBe(true);

    component.split();
    jest.advanceTimersByTime(1000);

    expect(component.playerHands()).toHaveLength(2);
    expect(component.playerHands()[0].cards).toHaveLength(2);
    expect(component.playerHands()[1].cards).toHaveLength(2);
    expect(component.playerHands()[0].cards[1].rank).toBe('3');
    expect(component.playerHands()[1].cards[1].rank).toBe('K');
    expect(component.chips()).toBe(80);
    expect(component.currentBet()).toBe(20);
    expect(component.phase()).toBe('player-turn');
  });

  it('should allow doubling by adding one card and doubling the hand bet', () => {
    component.chips.set(100);
    component.currentBet.set(20);
    component.phase.set('player-turn');
    component.activeHandIndex.set(0);
    component.playerHands.set([
      {
        id: 'hand-1',
        bet: 10,
        outcome: 'pending',
        wasSplitHand: false,
        finished: false,
        cards: [
          makeCard('h1-c1', '5', 5, 'hearts'),
          makeCard('h1-c2', '6', 6, 'clubs')
        ]
      },
      {
        id: 'hand-2',
        bet: 10,
        outcome: 'pending',
        wasSplitHand: true,
        finished: false,
        cards: [
          makeCard('h2-c1', '9', 9, 'spades'),
          makeCard('h2-c2', '7', 7, 'diamonds')
        ]
      }
    ] as never[]);

    setDeck(makeCard('double-draw', 'K', 10, 'spades'));

    expect(component.canDouble()).toBe(true);

    component.doubleDown();
    jest.advanceTimersByTime(700);

    expect(component.playerHands()[0].bet).toBe(20);
    expect(component.playerHands()[0].cards).toHaveLength(3);
    expect(component.playerHands()[0].finished).toBe(true);
    expect(component.currentBet()).toBe(30);
    expect(component.chips()).toBe(90);
    expect(component.activeHandIndex()).toBe(1);
    expect(component.phase()).toBe('player-turn');
  });

  it('should offer insurance when dealer shows an ace and lose it if dealer has no blackjack', () => {
    setDeck(
      makeCard('p-1', '9', 9, 'hearts'),
      makeCard('d-1', 'A', 11, 'spades'),
      makeCard('p-2', '7', 7, 'clubs'),
      makeCard('d-2', '9', 9, 'diamonds')
    );

    component.dealRound();
    jest.advanceTimersByTime(2000);

    expect(component.phase()).toBe('insurance');
    expect(component.canTakeInsurance()).toBe(true);

    component.takeInsurance();

    expect(component.phase()).toBe('player-turn');
    expect(component.insuranceBet()).toBe(0);
    expect(component.chips()).toBe(85);
    expect(component.currentBet()).toBe(10);
  });

  it('should pay insurance when dealer has blackjack', () => {
    setDeck(
      makeCard('p-1', '9', 9, 'hearts'),
      makeCard('d-1', 'A', 11, 'spades'),
      makeCard('p-2', '7', 7, 'clubs'),
      makeCard('d-2', 'K', 10, 'diamonds')
    );

    component.dealRound();
    jest.advanceTimersByTime(2000);

    component.takeInsurance();
    jest.advanceTimersByTime(600);

    expect(component.phase()).toBe('round-over');
    expect(component.outcome()).toBe('lose');
    expect(component.chips()).toBe(100);
    expect(component.message()).toContain('seguro');
  });
});
