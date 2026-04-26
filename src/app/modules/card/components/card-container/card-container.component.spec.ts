import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CardContainerComponent } from './card-container.component';
import { DataService } from '../../../../services/data.service';
import { HelperService } from '../../../../utils/helper.service';
import { Card } from '../../interfaces/card';

describe('CardContainerComponent', () => {
  let component: CardContainerComponent;
  let fixture: ComponentFixture<CardContainerComponent>;
  const createCardDeck = (): Card[] =>
    Array.from({ length: 5 }, (_, pairIndex) => {
      const baseId = pairIndex * 5;

      return [
        { id: baseId, value: `es-${pairIndex}`, voice: 'es-ES', pairs: [baseId + 1, baseId + 2, baseId + 3, baseId + 4], selected: false, match: false, icon: '' },
        { id: baseId + 1, value: `gb-${pairIndex}`, voice: 'en-GB', pairs: [baseId, baseId + 2, baseId + 3, baseId + 4], selected: false, match: false, icon: '' },
        { id: baseId + 2, value: `it-${pairIndex}`, voice: 'it-IT', pairs: [baseId, baseId + 1, baseId + 3, baseId + 4], selected: false, match: false, icon: '' },
        { id: baseId + 3, value: `pt-${pairIndex}`, voice: 'pt-PT', pairs: [baseId, baseId + 1, baseId + 2, baseId + 4], selected: false, match: false, icon: '' },
        { id: baseId + 4, value: `de-${pairIndex}`, voice: 'de-DE', pairs: [baseId, baseId + 1, baseId + 2, baseId + 3], selected: false, match: false, icon: '' }
      ];
    }).flat();
  const dataServiceMock = {
    getCards: jest.fn(() => of(createCardDeck()))
  };
  const helperServiceMock = {
    isSmallScreen: false
  };

  beforeEach(async () => {
    dataServiceMock.getCards.mockClear();

    await TestBed.configureTestingModule({
      declarations: [CardContainerComponent],
      providers: [
        { provide: DataService, useValue: dataServiceMock },
        { provide: HelperService, useValue: helperServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideComponent(CardContainerComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(CardContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch cards once on load', () => {
    expect(dataServiceMock.getCards).toHaveBeenCalledTimes(1);
  });

  it('should switch language without fetching again', () => {
    component.selectLanguage('it');

    expect(component.currentLanguage).toBe('it');
    expect(dataServiceMock.getCards).toHaveBeenCalledTimes(1);
    expect(component.progress).toBe(0);
  });
});
