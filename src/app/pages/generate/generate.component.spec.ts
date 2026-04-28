import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { GenerateComponent } from './generate.component';
import { DataService } from '../../services/data.service';
import { LoggerService } from '../../services/logger.service';

describe('GenerateComponent', () => {
  let component: GenerateComponent;
  let fixture: ComponentFixture<GenerateComponent>;
  const dataServiceMock = {
    getOpenAICredentials: jest.fn(() => of({ apiKey: '', organization: '' })),
    deleteCards: jest.fn(() => of({})),
    setCards: jest.fn(() => of({}))
  };
  const loggerServiceMock = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GenerateComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: DataService, useValue: dataServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
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

  it('should upload cards when the form has content', () => {
    component.form.controls.content.setValue('[{"icon":"home","es":"Casa","gb":"House","it":"Casa","pt":"Casa","de":"Haus"}]');

    component.uploadCards();

    expect(dataServiceMock.deleteCards).toHaveBeenCalled();
    expect(dataServiceMock.setCards).toHaveBeenCalled();
  });
});
