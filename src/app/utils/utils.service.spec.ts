import { UtilsService } from './utils.service';

describe('UtilsService', () => {
  it('should generate five linked cards per pair', () => {
    const service = new UtilsService();

    const cards = service.generateCards([
      {
        icon: 'house',
        es: 'casa',
        gb: 'house',
        it: 'casa',
        pt: 'casa',
        de: 'Haus'
      }
    ], ['gb', 'it', 'pt', 'de']);

    expect(cards).toHaveLength(5);
    expect(cards.map((card) => card.id)).toEqual([0, 1, 2, 3, 4]);
    expect(cards[0].pairs).toEqual([1, 2, 3, 4]);
    expect(cards[4].pairs).toEqual([0, 1, 2, 3]);
  });
});
