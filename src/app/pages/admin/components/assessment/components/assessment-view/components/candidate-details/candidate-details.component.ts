import { Component, computed, input } from '@angular/core';
import { CandidateData } from '../../models/manage-duplicate-candidates.model';

@Component({
  selector: 'app-candidate-details',
  imports: [],
  templateUrl: './candidate-details.component.html',
  styleUrl: './candidate-details.component.scss',
})
export class CandidateDetailsComponent {
  public data = input<CandidateData>();

  public entries = computed(() => Object.entries(this.data() ?? {}));
}
