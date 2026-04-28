import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MessageService } from 'primeng/api';
import { of } from 'rxjs';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { LoggerService } from '../../services/logger.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  const authServiceMock = {
    register: jest.fn(() => of({}))
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
      declarations: [RegisterComponent],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: MessageService, useValue: messageServiceMock },
        { provide: LoggerService, useValue: loggerServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideComponent(RegisterComponent, {
        set: { template: '' }
      })
      .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should register a user and return to login', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.form.setValue({
      email: 'test@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });

    component.onSubmit();

    expect(authServiceMock.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'secret123'
    });
    expect(messageServiceMock.add).toHaveBeenCalledWith(expect.objectContaining({
      severity: 'success',
    }));
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
