import { TestBed } from '@angular/core/testing';

import { CoordinatorPanelBridgeService } from './coordinator-panel-bridge.service';

describe('CoordinatorPanelBridgeService', () => {
  let service: CoordinatorPanelBridgeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoordinatorPanelBridgeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
