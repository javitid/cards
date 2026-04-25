import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { CardContainerComponent } from './card-container.component';
import { DataService } from '../../../../services/data.service';
import { HelperService } from '../../../../utils/helper.service';

describe('CardContainerComponent', () => {
  let component: CardContainerComponent;
  let fixture: ComponentFixture<CardContainerComponent>;
  const dataServiceMock = {
    getCards: jest.fn(() => of(Array.from({ length: 25 }, (_, index) => ({
      id: index,
      value: `card-${index}`,
      voice: 'es-ES',
      pairs: [],
      selected: false,
      match: false,
      icon: ''
    }))))
  };
  const helperServiceMock = {
    isSmallScreen: false
  };

  beforeEach(async () => {
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
});
