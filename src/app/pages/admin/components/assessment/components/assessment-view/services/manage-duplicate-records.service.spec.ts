import { TestBed } from '@angular/core/testing';

import { ManageDuplicateRecordsService } from './manage-duplicate-records.service';

describe('ManageDuplicateRecordsService', () => {
  let service: ManageDuplicateRecordsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManageDuplicateRecordsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
