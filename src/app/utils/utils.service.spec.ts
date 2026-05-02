import { UtilsService } from './utils.service';

describe('UtilsService', () => {
  it('should generate two linked cards per language pair', () => {
    const service = new UtilsService();

    const cards = service.generateLanguageCards([
      {
        icon: 'house',
        es: 'casa',
        gb: 'house',
        it: 'casa',
        pt: 'casa',
        de: 'Haus'
      }
    ], 'gb');

    expect(cards).toHaveLength(2);
    expect(cards.map((card) => card.id)).toEqual([0, 1]);
    expect(cards[0].groupId).toBe(0);
    expect(cards[0].pairs).toEqual([1]);
    expect(cards[1].pairs).toEqual([0]);
  });

  it('should generate two linked cards per binary pair', () => {
    const service = new UtilsService();

    const cards = service.generateBinaryCards([
      {
        icon: '',
        left: '3 + 12',
        right: '15'
      }
    ]);

    expect(cards).toHaveLength(2);
    expect(cards[0].value).toBe('3 + 12');
    expect(cards[1].value).toBe('15');
    expect(cards[0].pairs).toEqual([1]);
    expect(cards[1].pairs).toEqual([0]);
  });
});
