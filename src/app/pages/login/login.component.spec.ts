import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { LoggerService } from '../../services/logger.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  const authServiceMock = {
    login: jest.fn(() => of({})),
    LoginWithGoogle: jest.fn(() => of({})),
    loginAsGuest: jest.fn(() => of({}))
  };
  const messageServiceMock = {
    add: jest.fn()
  };
  const loggerServiceMock = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: MessageService, useValue: messageServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(LoginComponent, {
      set: { template: '' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should log in with email and password', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.componentInstance.form.setValue({
      username: 'test@example.com',
      password: 'secret123',
    });

    fixture.componentInstance.onSubmit();

    expect(authServiceMock.login).toHaveBeenCalledWith({
      username: 'test@example.com',
      password: 'secret123',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/game']);
  });

  it('should allow guest access', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.loginAsGuest();

    expect(authServiceMock.loginAsGuest).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/game']);
  });
});
