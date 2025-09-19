import { Component, Input } from '@angular/core';
import { ImageComponent } from '../../../../shared/components/image';
import { InterviewService } from '../../../admin/components/assessment/services/interview.service';
import { ImageSkeletonComponent } from '../../../../shared/components/image/image-skeleton';

@Component({
  selector: 'app-question',
  imports: [ImageComponent, ImageSkeletonComponent],
  templateUrl: './question.component.html',
  styleUrl: './question.component.scss',
})
export class QuestionComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() question!: any;
  @Input() previewImageUrls: Record<number, string[]> = {};
  @Input() imageLoading = false;
  constructor(private readonly interviewService: InterviewService) {}
}
