import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SideNavComponent } from '../../shared/components/side-nav/side-nav.component';
import { StoreService } from '../../shared/services/store.service';
import { DashboardComponent } from './dashboard.component';

@Component({
  standalone: true,
  template: '<p>Dummy Component</p>',
})
class DummyComponent {}

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockStoreService: jasmine.SpyObj<StoreService>;
  const mockLinks = {
    admin: [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/admin/dashboard'],
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Recruitments',
        icon: 'pi pi-file-edit',
        routerLink: ['/admin/recruitments'],
        routerLinkActiveOptions: { exact: false },
      },
      {
        label: 'Interviews',
        icon: 'pi pi-calendar',
        routerLink: ['/admin/interviews'],
        routerLinkActiveOptions: { exact: false },
      },
      {
        label: 'Roles & Access',
        icon: 'pi pi-users',
        routerLink: ['/admin/roles-access'],
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        items: [
          {
            label: 'Questions',
            icon: 'pi pi-file-check',
            routerLink: ['/admin/settings/questions'],
            routerLinkActiveOptions: { exact: true },
          },
          {
            label: 'Batches',
            icon: 'pi pi-file-check',
            routerLink: ['/admin/settings/batches'],
            routerLinkActiveOptions: { exact: true },
          },
        ],
      },
    ] as MenuItem[],

    superadmin: [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/admin/dashboard'],
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Recruitments',
        icon: 'pi pi-file-edit',
        routerLink: ['/admin/recruitments'],
        routerLinkActiveOptions: { exact: false },
      },
      {
        label: 'Interviews',
        icon: 'pi pi-calendar',
        routerLink: ['/admin/interviews'],
        routerLinkActiveOptions: { exact: false },
      },
      {
        label: 'Roles & Access',
        icon: 'pi pi-users',
        routerLink: ['/admin/roles-access'],
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        items: [
          {
            label: 'Questions',
            icon: 'pi pi-file-check',
            routerLink: ['/admin/settings/questions'],
            routerLinkActiveOptions: { exact: true },
          },
          {
            label: 'Batches',
            icon: 'pi pi-file-check',
            routerLink: ['/admin/settings/batches'],
            routerLinkActiveOptions: { exact: true },
          },
        ],
      },
    ] as MenuItem[],

    candidate: [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/candidate/dashboard'],
        routerLinkActiveOptions: { exact: true },
      },
    ] as MenuItem[],

    interviewer: [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/interviewer'],
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Recruitments',
        icon: 'pi pi-file-edit',
        routerLink: ['/interviewer/recruitments'],
        routerLinkActiveOptions: { exact: false },
      },
    ] as MenuItem[],

    coordinator: [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/coordinator'],
        routerLinkActiveOptions: { exact: true },
      },
      {
        label: 'Recruitments',
        icon: 'pi pi-file-edit',
        routerLink: ['/coordinator/recruitments'],
        routerLinkActiveOptions: { exact: false },
      },
    ] as MenuItem[],

    fallback: [
      {
        label: 'Dashboard',
        icon: 'pi pi-home',
        routerLink: ['/candidate'],
        routerLinkActiveOptions: { exact: true },
      },
    ] as MenuItem[],
  };

  beforeEach(async () => {
    const storeSpy = jasmine.createSpyObj('StoreService', ['getUserRole']);
    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        RouterOutlet,
        SideNavComponent,
        HeaderComponent,
        DummyComponent,
      ],
      providers: [
        { provide: StoreService, useValue: storeSpy },
        provideRouter([
          { path: 'admin/dashboard', component: DummyComponent },
          { path: 'admin/recruitments', component: DummyComponent },
          { path: 'admin/interviews', component: DummyComponent },
          { path: 'admin/roles-access', component: DummyComponent },
          { path: 'admin/settings/questions', component: DummyComponent },
          { path: 'admin/settings/batches', component: DummyComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    mockStoreService = TestBed.inject(
      StoreService,
    ) as jasmine.SpyObj<StoreService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getUserRole once during ngOnInit', () => {
    const spy = mockStoreService.getUserRole.and.returnValue(['admin']);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should set admin links correctly', () => {
    mockStoreService.getUserRole.and.returnValue(
      'admin' as unknown as string[],
    );
    component.ngOnInit();
    expect(component.links).toEqual(mockLinks.admin);
  });

  it('should set superadmin links correctly', () => {
    mockStoreService.getUserRole.and.returnValue(
      'superadmin' as unknown as string[],
    );
    component.ngOnInit();
    expect(component.links).toEqual(mockLinks.superadmin);
  });

  it('should set candidate links correctly', () => {
    mockStoreService.getUserRole.and.returnValue(
      'candidate' as unknown as string[],
    );
    component.ngOnInit();
    expect(component.links).toEqual(mockLinks.candidate);
  });

  it('should set interviewer links correctly', () => {
    mockStoreService.getUserRole.and.returnValue(
      'interviewer' as unknown as string[],
    );
    component.ngOnInit();
    expect(component.links).toEqual(mockLinks.interviewer);
  });

  it('should set coordinator links correctly', () => {
    mockStoreService.getUserRole.and.returnValue(
      'coordinator' as unknown as string[],
    );
    component.ngOnInit();
    expect(component.links).toEqual(mockLinks.coordinator);
  });

  it('should fall back to default links when role is unknown', () => {
    mockStoreService.getUserRole.and.returnValue(
      'randomrole' as unknown as string[],
    );
    component.ngOnInit();
    expect(component.links).toEqual(mockLinks.fallback);
  });

  it('should fall back to default links when role is null', () => {
    mockStoreService.getUserRole.and.returnValue(null);
    component.ngOnInit();
    expect(component.links).toEqual(mockLinks.fallback);
  });

  it('should have nested items under Settings menu', () => {
    mockStoreService.getUserRole.and.returnValue(['admin']);
    component.ngOnInit();
    const settings = component.links.find((l) => l.label === 'Settings');
    expect(settings).toBeDefined();
    expect(settings?.items?.length).toBeGreaterThan(0);
  });

  it('candidate role should NOT see admin-only links', () => {
    mockStoreService.getUserRole.and.returnValue(['candidate']);
    component.ngOnInit();
    const adminOnlyLabels = mockLinks.admin
      .filter((link) => link.label && link.label.toLowerCase() !== 'dashboard')
      .map((link) => link.label!.toLowerCase());

    const candidateLabels = component.links
      .map((link) => link.label?.toLowerCase())
      .filter((label): label is string => !!label);

    adminOnlyLabels.forEach((adminLabel) => {
      expect(candidateLabels).not.toContain(adminLabel);
    });
  });

  it('should prioritize admin role links when multiple roles present', () => {
    mockStoreService.getUserRole.and.returnValue(['candidate', 'admin']);
    component.ngOnInit();
    expect(component.links).toEqual(mockLinks.admin);
  });
});
