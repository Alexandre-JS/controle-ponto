import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { IonicModule } from '@ionic/angular';
import { AppComponent } from './app.component';
import { SupabaseService } from './services/supabase.service';
import { AuthService } from './services/auth.service';
import { BehaviorSubject, of } from 'rxjs';

describe('AppComponent', () => {
  const mockSupabaseService = {
    session: of(null),
    loadSession: () => Promise.resolve(),
    getCurrentUser: () => Promise.resolve({ data: { user: null }, error: null })
  };

  const mockAuthService = {
    isAuthenticated: () => of(false),
    checkAuth: () => Promise.resolve()
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        IonicModule.forRoot(),
        AppComponent
      ],
      providers: [
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

});
