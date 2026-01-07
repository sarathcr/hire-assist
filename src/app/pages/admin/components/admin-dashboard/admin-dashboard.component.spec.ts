import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DashboardCardSkeletonComponent } from '../../../../shared/components/dashboard-card/dashboard-card-skeleton';
import { DashboardCardComponent } from '../../../../shared/components/dashboard-card/dashboard-card.component';
import { StoreService } from '../../../../shared/services/store.service';
import { DashboardData } from '../../models/dashboard.model';
import { DashboardService } from '../../services/dashboard.service';
import { AdminDashboardComponent } from './admin-dashboard.component';

interface MockUserState {
  id: string;
  name: string;
  role: string;
}

const mockUserData: MockUserState = {
  id: '123',
  name: 'Admin User',
  role: 'admin',
};

const mockDashboardData: DashboardData = {
  data: {
    assessment: { total: 10, active: 7, inactive: 3 },
    users: { total: 50 },
    questions: { total: 5 },
  },
};

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let mockDashboardService: jasmine.SpyObj<DashboardService<DashboardData>>;
  let mockStoreService: jasmine.SpyObj<StoreService>;

  beforeEach(async () => {
    mockDashboardService = jasmine.createSpyObj('DashboardService', [
      'getEntityById',
    ]);
    mockStoreService = jasmine.createSpyObj('StoreService', ['getUserData']);

    await TestBed.configureTestingModule({
      imports: [
        AdminDashboardComponent,
        DashboardCardComponent,
        DashboardCardSkeletonComponent,
      ],
      providers: [
        { provide: DashboardService, useValue: mockDashboardService },
        { provide: StoreService, useValue: mockStoreService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {},
              data: {},
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call getDashboardDetails on init when user ID is available', fakeAsync(() => {
    mockStoreService.getUserData.and.returnValue(mockUserData);
    mockDashboardService.getEntityById.and.returnValue(of(mockDashboardData));

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(mockStoreService.getUserData).toHaveBeenCalled();
    expect(mockDashboardService.getEntityById).toHaveBeenCalledWith('123');
    expect(component.assessmentData?.total).toBe(10);
    expect(component.usersData?.total).toBe(50);
    expect(component.questionsData?.total).toBe(5);
  }));

  it('should handle errors from dashboard service gracefully', fakeAsync(() => {
    const consoleSpy = spyOn(console, 'log');
    mockStoreService.getUserData.and.returnValue(mockUserData);
    mockDashboardService.getEntityById.and.returnValue(
      throwError(() => new Error('API Error')),
    );

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(consoleSpy).toHaveBeenCalledWith('ERROR', jasmine.any(Error));
  }));

  it('should not call getDashboardDetails if user ID is missing', fakeAsync(() => {
    mockStoreService.getUserData.and.returnValue({
      name: 'Admin',
      role: 'admin',
      id: '',
    });

    component.ngOnInit();
    tick();
    fixture.detectChanges();

    expect(mockStoreService.getUserData).toHaveBeenCalled();
    expect(mockDashboardService.getEntityById).not.toHaveBeenCalled();
  }));
});
