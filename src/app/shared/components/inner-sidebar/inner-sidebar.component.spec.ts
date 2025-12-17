import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InnerSidebarComponent } from './inner-sidebar.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MenuModule } from 'primeng/menu';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('InnerSidebarComponent', () => {
  let component: InnerSidebarComponent;
  let fixture: ComponentFixture<InnerSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, MenuModule, InnerSidebarComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(InnerSidebarComponent);
    component = fixture.componentInstance;
    // Provide default inputs
    fixture.componentRef.setInput('items', [
      { label: 'Home', icon: 'pi pi-home', route: '/home', index: 0 },
      { label: 'Profile', icon: 'pi pi-user', route: '/profile', index: 1 },
    ]);
    fixture.componentRef.setInput('activeMenuItem', 0);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle showMenu when button is clicked', () => {
    const btn: DebugElement = fixture.debugElement.query(
      By.css('.inner-sidebar__btn'),
    );
    expect(component.showMenu).toBeTrue();
    btn.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(component.showMenu).toBeFalse();
    btn.triggerEventHandler('click', {});
    fixture.detectChanges();
    expect(component.showMenu).toBeTrue();
  });

  it('should apply correct sidebar class based on showMenu', () => {
    component.showMenu = true;
    fixture.detectChanges();
    let sidebarDiv = fixture.debugElement.query(By.css('.inner-sidebar'));
    expect(sidebarDiv.nativeElement.classList).toContain(
      'inner-sidebar_expand',
    );

    component.showMenu = false;
    fixture.detectChanges();
    sidebarDiv = fixture.debugElement.query(By.css('.inner-sidebar'));
    expect(sidebarDiv.nativeElement.classList).toContain(
      'inner-sidebar_collapse',
    );
  });

  it('should render menu items', () => {
    fixture.detectChanges();
    const menuLinks = fixture.debugElement.queryAll(
      By.css('.p-menu-item-link'),
    );
    expect(menuLinks.length).toBe(2);
    expect(menuLinks[0].nativeElement.textContent).toContain('Home');
    expect(menuLinks[1].nativeElement.textContent).toContain('Profile');
  });

  it('should highlight the active menu item', () => {
    fixture.detectChanges();
    const menuLinks = fixture.debugElement.queryAll(
      By.css('.p-menu-item-link'),
    );
    expect(menuLinks[0].nativeElement.classList).toContain('active');
    expect(menuLinks[1].nativeElement.classList).not.toContain('active');
  });
  it('should not render menu items if items input is empty', () => {
    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    const menuLinks = fixture.debugElement.queryAll(
      By.css('.p-menu-item-link'),
    );
    expect(menuLinks.length).toBe(0);
  });
  it('should render menu item icon and label', () => {
    fixture.detectChanges();
    const menuLinks = fixture.debugElement.queryAll(
      By.css('.p-menu-item-link'),
    );
    expect(
      menuLinks[0].query(By.css('span')).nativeElement.className,
    ).toContain('pi pi-home');
    expect(menuLinks[0].nativeElement.textContent).toContain('Home');
    expect(
      menuLinks[1].query(By.css('span')).nativeElement.className,
    ).toContain('pi pi-user');
    expect(menuLinks[1].nativeElement.textContent).toContain('Profile');
  });
  it('should not render menu items if items input is undefined', () => {
    fixture.componentRef.setInput('items', undefined);
    fixture.detectChanges();
    const menuLinks = fixture.debugElement.queryAll(
      By.css('.p-menu-item-link'),
    );
    expect(menuLinks.length).toBe(0);
  });
  it('should not render menu items if items input is null', () => {
    fixture.componentRef.setInput('items', null);
    fixture.detectChanges();
    const menuLinks = fixture.debugElement.queryAll(
      By.css('.p-menu-item-link'),
    );
    expect(menuLinks.length).toBe(0);
  });
  it('should not highlight any menu item if activeMenuItem is out of range', () => {
    fixture.componentRef.setInput('activeMenuItem', 99);
    fixture.detectChanges();
    const menuLinks = fixture.debugElement.queryAll(
      By.css('.p-menu-item-link'),
    );
    menuLinks.forEach((link) => {
      expect(link.nativeElement.classList).not.toContain('active');
    });
  });
  it('should highlight the correct menu item based on activeMenuItem index', () => {
    fixture.componentRef.setInput('activeMenuItem', 1);
    fixture.detectChanges();
    const menuLinks = fixture.debugElement.queryAll(
      By.css('.p-menu-item-link'),
    );
    expect(menuLinks[0].nativeElement.classList).not.toContain('active');
    expect(menuLinks[1].nativeElement.classList).toContain('active');
  });
  it('should show left arrow icon and close class when expanded', () => {
    component.showMenu = true;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('.inner-sidebar__btn'));
    expect(btn.nativeElement.classList).toContain('pi-arrow-left');
    expect(btn.nativeElement.classList).toContain('inner-sidebar__btn_close');
    expect(btn.nativeElement.classList).not.toContain('pi-arrow-right');
    expect(btn.nativeElement.classList).not.toContain('inner-sidebar__btn_bar');
  });
  it('should show right arrow icon and bar class when collapsed', () => {
    component.showMenu = false;
    fixture.detectChanges();
    const btn = fixture.debugElement.query(By.css('.inner-sidebar__btn'));
    expect(btn.nativeElement.classList).toContain('pi-arrow-right');
    expect(btn.nativeElement.classList).toContain('inner-sidebar__btn_bar');
    expect(btn.nativeElement.classList).not.toContain('pi-arrow-left');
    expect(btn.nativeElement.classList).not.toContain(
      'inner-sidebar__btn_close',
    );
  });
  it('should add "active" class to the menu item with matching index', () => {
    fixture.componentRef.setInput('activeMenuItem', 1);
    fixture.detectChanges();
    const menuLinks = fixture.debugElement.queryAll(
      By.css('.p-menu-item-link'),
    );
    expect(menuLinks[1].nativeElement.classList).toContain('active');
    expect(menuLinks[0].nativeElement.classList).not.toContain('active');
  });
});
