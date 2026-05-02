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
});
