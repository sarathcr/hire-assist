import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { StepperModule } from 'primeng/stepper';
import { StepsModule } from 'primeng/steps';
import { TableSkeletonComponent } from '../table/table.skeleton';

@Component({
  selector: 'app-stepper-skeleton',
  imports: [SkeletonModule, StepsModule, StepperModule, TableSkeletonComponent],
  template: `<div class="stepper stepper_skeleton">
    <p-stepper [value]="" class="basis-[50rem]" [linear]="true">
      <p-step-list class="stepper_skeleton__list">
        @for (step of config; track step) {
          <div style="width: 100%; margin-right:25px;">
            <p-skeleton width="100%" />
          </div>
        }
      </p-step-list>
      <p-step-panels>
        <app-table-skeleton></app-table-skeleton>
      </p-step-panels>
    </p-stepper>
  </div>`,
  styleUrl: './stepper.component.scss',
})
export class StepperSkeletonComponent {
  public config = [1, 2, 3, 4, 5, 6];
}
