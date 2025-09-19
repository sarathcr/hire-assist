import { TestBed } from '@angular/core/testing';
import { QuestionService } from './question.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('QuestionService', () => {
  let service: QuestionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClientTesting()],
    });
    service = TestBed.inject(QuestionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
