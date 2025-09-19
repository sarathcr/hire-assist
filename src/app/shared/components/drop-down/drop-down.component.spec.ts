/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ComponentFixture,
  ComponentFixtureAutoDetect,
  TestBed,
} from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';

import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { DropDownComponent } from './drop-down.component';

import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: '<p>Dummy</p>',
})
class DummyComponent {}

describe('DropDownComponent', () => {
  let component: DropDownComponent;
  let fixture: ComponentFixture<DropDownComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropDownComponent, Menu, ButtonModule],
      providers: [
        { provide: ComponentFixtureAutoDetect, useValue: true },
        provideRouter([{ path: 'profile', component: DummyComponent }]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DropDownComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize menu items on ngOnInit', () => {
    component.ngOnInit();
    expect(component.items?.length).toBeGreaterThan(0);
    expect(component.items?.[0].items?.[0].label).toBe('Profile');
  });

  it('should contain Profile and Logout items', () => {
    component.ngOnInit();
    const submenuItems = component.items?.[0].items;
    const labels = submenuItems?.map((item: MenuItem) => item.label);
    expect(labels).toContain('Profile');
    expect(labels).toContain('Logout');
  });

  it('should call toggle on menu when button is clicked', () => {
    const menu = fixture.debugElement.query(By.css('p-menu')).references[
      'menu'
    ];
    spyOn(menu, 'toggle');
    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', new Event('click'));
    expect(menu.toggle).toHaveBeenCalled();
  });

  it('should not call toggle on menu when button is not clicked', () => {
    const menu = fixture.debugElement.query(By.css('p-menu')).references[
      'menu'
    ];
    spyOn(menu, 'toggle');
    expect(menu.toggle).not.toHaveBeenCalled();
  });

  it('should navigate to profile when navigateToProfile is called', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.navigateToProfile();
    expect(navigateSpy).toHaveBeenCalledWith(['/profile']);
  });

  it('should handle router navigation error', () => {
    spyOn(router, 'navigate').and.throwError('Navigation Error');
    expect(() => component.navigateToProfile()).toThrowError(
      'Navigation Error',
    );
  });
});
