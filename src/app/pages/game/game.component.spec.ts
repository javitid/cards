import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from '../../services/auth.service';

import { GameComponent } from './game.component';

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;
  const authServiceMock = {
    username: signal('Invitado'),
    logout: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GameComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should logout and navigate to login', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.logout();

    expect(authServiceMock.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
