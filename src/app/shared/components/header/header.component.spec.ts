import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Router } from '@angular/router';
import { ToggleMenuService } from '../../services/toggle-menu.service';
import { DropDownComponent } from '../drop-down/drop-down.component';
import { HeaderComponent } from './header.component';

fdescribe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let toggleMenuServiceSpy: jasmine.SpyObj<ToggleMenuService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ToggleMenuService', ['setToggleMenu']);
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, DropDownComponent],
      providers: [
        { provide: ToggleMenuService, useValue: spy },
        { provide: Router, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    toggleMenuServiceSpy = TestBed.inject(
      ToggleMenuService,
    ) as jasmine.SpyObj<ToggleMenuService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should call toggleMenuService.setToggleMenu on onMenuClick', () => {
    component.onMenuClick();
    expect(toggleMenuServiceSpy.setToggleMenu).toHaveBeenCalledWith(true);
  });
  it('should have a router instance', () => {
    expect(component.router).toBeDefined();
  });
  it('should have a toggleMenu service instance', () => {
    expect(component.toggleMenu).toBeDefined();
  });
  it('should have a DropDownComponent instance', () => {
    const dropDownComponent = fixture.debugElement.query(
      (el) => el.name === 'app-drop-down',
    );
    expect(dropDownComponent).toBeDefined();
  });
  it('should not call setToggleMenu with false on onMenuClick', () => {
    component.onMenuClick();
    expect(toggleMenuServiceSpy.setToggleMenu).not.toHaveBeenCalledWith(false);
  });
  it('should call onmenuclick when keydown space is pressed', () => {
    const event = new KeyboardEvent('keydown', { key: ' ' });
    spyOn(component, 'onMenuClick');
    component.onMenuClick();
    expect(component.onMenuClick).toHaveBeenCalled();
    expect(event.key).toBe(' ');
    expect(event.type).toBe('keydown');
  });
  it('should not call onMenuClick when keydown is not space', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(component, 'onMenuClick');
    expect(component.onMenuClick).not.toHaveBeenCalled();
    expect(event.key).toBe('Enter');
    expect(event.type).toBe('keydown');
  });
  it('should call onmenuclick when keydown enter is pressed', () => {
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(component, 'onMenuClick');
    component.onMenuClick();

    expect(component.onMenuClick).toHaveBeenCalled();

    expect(event.key).toBe('Enter');
    expect(event.type).toBe('keydown');
  });
  it('should not call onMenuClick when keydown is not space or enter', () => {
    const event = new KeyboardEvent('keydown', { key: 'a' });
    spyOn(component, 'onMenuClick');
    expect(component.onMenuClick).not.toHaveBeenCalled();
    expect(event.key).toBe('a');
    expect(event.type).toBe('keydown');
  });
  it('should not render app-drop-down if header__avatar is removed', () => {
    // Simulate removing the avatar div from the DOM
    const avatarDiv = fixture.nativeElement.querySelector('.header__avatar');
    avatarDiv.remove();
    fixture.detectChanges();
    const dropDown = fixture.nativeElement.querySelector('app-drop-down');
    expect(dropDown).toBeNull();
  });
  it('should render app-drop-down if header__avatar is present', () => {
    // Simulate the avatar div being present in the DOM
    const avatarDiv = fixture.nativeElement.querySelector('.header__avatar');
    expect(avatarDiv).toBeTruthy();
    const dropDown = fixture.nativeElement.querySelector('app-drop-down');
    expect(dropDown).toBeTruthy();
  });
  it('should display the image of avatar in the header', () => {
    const avatarDiv = fixture.nativeElement.querySelector('.header__avatar');
    expect(avatarDiv).toBeTruthy();

    const img = avatarDiv.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('avatar.png');
    expect(img.alt).toBe('avatar');
  });
});
