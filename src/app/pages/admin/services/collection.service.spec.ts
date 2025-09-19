import { TestBed } from '@angular/core/testing';

import { CollectionService } from './collection.service';

describe('DashboardService', () => {
  let service: CollectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CollectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
