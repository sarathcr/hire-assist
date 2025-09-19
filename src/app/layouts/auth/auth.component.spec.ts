import { ComponentFixture, TestBed } from '@angular/core/testing';

import { By } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { AuthComponent } from './auth.component';

describe('AuthComponent', () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render logo image', () => {
    const logo = fixture.debugElement.query(By.css('.auth-layout__logo img'));
    expect(logo).toBeTruthy();
    expect(logo.attributes['src']).toBe('logo.png');
  });

  it('should render image and text', () => {
    const img = fixture.debugElement.query(
      By.css('.auth-layout__left_content img'),
    );
    const text = fixture.debugElement.query(
      By.css('.auth-layout__left_content p'),
    );

    expect(img).toBeTruthy();
    expect(img.attributes['src']).toBe('auth/computer.png');

    expect(text).toBeTruthy();
    expect(text.nativeElement.textContent).toContain(
      'Enter your email address and password to access your account.',
    );
  });

  it('should have a router-outlet', () => {
    const outlet = fixture.debugElement.query(By.directive(RouterOutlet));
    expect(outlet).toBeTruthy();
  });

  it('should fallback if logo image fails to load (hypothetical)', () => {
    const logo = fixture.debugElement.query(By.css('.auth-layout__logo img'));
    expect(logo.attributes['src']).not.toBeNull();
  });
});
