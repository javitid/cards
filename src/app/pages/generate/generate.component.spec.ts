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
    })
      .overrideComponent(GenerateComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(GenerateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should upload cards when the form has content', () => {
    component.form.controls.gameId.setValue('languages');
    component.form.controls.level.setValue('easy');
    component.form.controls.content.setValue('[{"icon":"home","es":"Casa","gb":"House","it":"Casa","pt":"Casa","de":"Haus"}]');

    component.uploadCards();

    expect(dataServiceMock.deleteCards).toHaveBeenCalledWith('languages', 'easy');
    expect(dataServiceMock.setCards).toHaveBeenCalledWith(
      [{ icon: 'home', es: 'Casa', gb: 'House', it: 'Casa', pt: 'Casa', de: 'Haus' }],
      'languages',
      'easy'
    );
  });

  it('should swap the template when changing to the math game', () => {
    component.form.controls.gameId.setValue('math');

    expect(component.form.controls.content.value).toContain('3 + 12');
    expect(component.form.controls.content.value).toContain('"left"');
    expect(component.form.controls.content.value).toContain('"right"');
  });
});
