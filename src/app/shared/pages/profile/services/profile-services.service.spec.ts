import { TestBed } from '@angular/core/testing';

import { ProfileServicesService } from './profile-services.service';

describe('ProfileServicesService', () => {
  let service: ProfileServicesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfileServicesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
