import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CardComponent]
    });
    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    component.card = {
      id: 1,
      value: 'casa',
      voice: 'es-ES',
      pairs: [2],
      selected: false,
      match: false,
      icon: 'house'
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('detects image cards', () => {
    component.card = {
      id: 2,
      value: 'Bandera de España',
      voice: '',
      pairs: [3],
      selected: false,
      match: false,
      icon: '',
      contentType: 'image',
      imagePath: 'assets/memory-countries/spain.svg'
    } as any;

    expect(component.isImageCard).toBe(true);
  });
});
