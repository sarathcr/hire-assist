import { TestBed } from '@angular/core/testing';

import { QuestionSetStateService } from './question-set-state.service';

describe('QuestionSetStateService', () => {
  let service: QuestionSetStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuestionSetStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
