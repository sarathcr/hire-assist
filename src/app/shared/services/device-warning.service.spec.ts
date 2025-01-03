import { TestBed } from '@angular/core/testing';

import { DeviceWarningService } from './device-warning.service';

describe('DeviceWarningService', () => {
  let service: DeviceWarningService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceWarningService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
