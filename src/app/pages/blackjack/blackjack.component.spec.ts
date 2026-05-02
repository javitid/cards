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
    component.dealRound();
    jest.advanceTimersByTime(2000);

    expect(component.playerHands()).toHaveLength(1);
    expect(component.playerHands()[0].cards).toHaveLength(2);
    expect(component.dealerHand()).toHaveLength(2);
    expect(component.chips()).toBe(90);
  });

  it('should reset the table back to the starting chips', () => {
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
});
