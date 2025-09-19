import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
interface DummyData {
  id: string;
  name: string;
}
describe('DashboardService', () => {
  let service: DashboardService<DummyData>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardService<DummyData>);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
