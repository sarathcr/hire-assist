import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { InputTextareaComponent } from '../../../../../../../../shared/components/form/input-textarea/input-textarea.component';

@Component({
  selector: 'app-interviewer-candidate-assessment',
  imports: [InputTextareaComponent],
  templateUrl: './interviewer-candidate-assessment.component.html',
  styleUrl: './interviewer-candidate-assessment.component.scss',
})
export class InterviewerCandidateAssessmentComponent implements OnInit {
  public fGroup!: FormGroup;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  ngOnInit(): void {
    // this.selectedCandidateIds = this.config.data || [];
    console.log('in dialogbox');
  }
}
