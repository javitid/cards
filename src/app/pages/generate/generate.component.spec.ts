import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { GenerateComponent } from './generate.component';
import { DataService } from '../../services/data.service';

describe('GenerateComponent', () => {
  let component: GenerateComponent;
  let fixture: ComponentFixture<GenerateComponent>;
  const dataServiceMock = {
    getOpenAICredentials: jest.fn(() => of({ apiKey: '', organization: '' })),
    deleteCards: jest.fn(() => of({})),
    setCards: jest.fn(() => of({}))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GenerateComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: DataService, useValue: dataServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(GenerateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
