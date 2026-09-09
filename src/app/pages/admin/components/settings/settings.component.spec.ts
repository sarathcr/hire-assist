import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, NavigationEnd } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SettingsComponent } from './settings.component';
import { Subject } from 'rxjs';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [provideRouter([]), provideNoopAnimations()],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 3 settings menu groups with 6 items in total', () => {
    expect(component.settingsMenuItems.length).toBe(3);
    expect(component.settingsMenuItems[0].label).toBe('Assessment');
    expect(component.settingsMenuItems[0].items?.length).toBe(2);
    expect(component.settingsMenuItems[0].items?.[0].label).toBe('Questions');
    expect(component.settingsMenuItems[0].items?.[1].label).toBe('Question Types');

    expect(component.settingsMenuItems[1].label).toBe('Interview Management');
    expect(component.settingsMenuItems[1].items?.length).toBe(3);
    expect(component.settingsMenuItems[1].items?.[0].label).toBe('Batches');
    expect(component.settingsMenuItems[1].items?.[1].label).toBe('Panels');
    expect(component.settingsMenuItems[1].items?.[2].label).toBe('Panel Assignment');

    expect(component.settingsMenuItems[2].label).toBe('Organization');
    expect(component.settingsMenuItems[2].items?.length).toBe(1);
    expect(component.settingsMenuItems[2].items?.[0].label).toBe('Departments');
  });

  it('should have Questions (index 0) active by default', () => {
    expect(component.activeMenuItem).toBe(0);
  });

  it('should update activeMenuItem and pageTitle based on route', () => {
    (component as any).updateActiveMenuItem('/admin/settings/questions');
    expect(component.activeMenuItem).toBe(0);
    expect(component.pageTitle).toBe('Questions');

    (component as any).updateActiveMenuItem('/admin/settings/question-types');
    expect(component.activeMenuItem).toBe(1);
    expect(component.pageTitle).toBe('Question Types');

    (component as any).updateActiveMenuItem('/admin/settings/batches');
    expect(component.activeMenuItem).toBe(2);
    expect(component.pageTitle).toBe('Batches');

    (component as any).updateActiveMenuItem('/admin/settings/panels');
    expect(component.activeMenuItem).toBe(3);
    expect(component.pageTitle).toBe('Panels');

    (component as any).updateActiveMenuItem('/admin/settings/panel-assignment');
    expect(component.activeMenuItem).toBe(4);
    expect(component.pageTitle).toBe('Assign Panel');

    (component as any).updateActiveMenuItem('/admin/settings/departments');
    expect(component.activeMenuItem).toBe(5);
    expect(component.pageTitle).toBe('Departments');
  });
});

