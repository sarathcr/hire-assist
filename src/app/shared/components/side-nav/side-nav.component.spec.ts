import { CommonModule } from '@angular/common';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuItem } from 'primeng/api';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { MenuModule } from 'primeng/menu';
import { PanelMenuModule } from 'primeng/panelmenu';
import { RippleModule } from 'primeng/ripple';
import { ToggleMenuService } from '../../services/toggle-menu.service';
import { SideNavComponent } from './side-nav.component';

describe('SideNavComponent', () => {
  let component: SideNavComponent;
  let fixture: ComponentFixture<SideNavComponent>;
  let mockToggleMenuService: jasmine.SpyObj<ToggleMenuService>;

  beforeEach(async () => {
    mockToggleMenuService = jasmine.createSpyObj('ToggleMenuService', [
      'getToggleMenu',
      'setToggleMenu',
    ]);

    const menuSignal = signal(true);
    mockToggleMenuService.getToggleMenu.and.callFake(() => menuSignal());

    await TestBed.configureTestingModule({
      imports: [
        SideNavComponent,
        MenuModule,
        BadgeModule,
        RippleModule,
        AvatarModule,
        CommonModule,
        PanelMenuModule,
      ],
      providers: [
        { provide: ToggleMenuService, useValue: mockToggleMenuService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should reflect showMenu as true when toggleMenu service returns true', () => {
    expect(component.showMenu()).toBeTrue();
  });

  it('should call toggleMenu.setToggleMenu(false) when closeToggleMenu is called', () => {
    component.closeToggleMenu();
    expect(mockToggleMenuService.setToggleMenu).toHaveBeenCalledWith(false);
  });

  it('should bind navLinks input properly', () => {
    const mockLinks: MenuItem[] = [{ label: 'Home', icon: 'pi pi-home' }];
    component.navLinks = mockLinks;
    fixture.detectChanges();
    expect(component.navLinks).toEqual(mockLinks);
  });
});
