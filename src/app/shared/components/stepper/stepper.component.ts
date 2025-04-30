/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { StepperModule } from 'primeng/stepper';
import { StepsModule } from 'primeng/steps';
import { StepperService } from '../../../pages/admin/components/assessment/services/stepper.service';

@Component({
  selector: 'app-stepper',
  imports: [
    ButtonModule,
    StepsModule,
    StepperModule,
    CommonModule,
    InputIconModule,
    IconFieldModule,
  ],
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
})
export class StepperComponent implements OnInit {
  @Input() config!: { header: string; value: number; component?: any; color?: any }[];

  public stageChange = output<number>();

  public activeStepValue = 1;

  constructor(private stepperService: StepperService) { }

  ngOnInit(): void {
    this.setInitialStep();
    this.stepperService.advanceStep$.subscribe(() => {
      this.goToNextStep();
    });
  }

  // Handle step changes when user interacts with stepper
  public onStepChange(stepValue: number): void {
    const step = this.config.find((s) => s.value === stepValue);
    const index = this.config.findIndex((s) => s.value === stepValue);
    if (step) {
      this.activeStepValue = stepValue;
      this.stepperService.setStep({
        stepId: step.value,
        sidebarMenu: 0,
      });
      this.stageChange.emit(stepValue);
    }
  }

  private setInitialStep(): void {
    console.log('Initial Step:', this.activeStepValue, "stepvalue");
    const activeStep = this.config?.find(
      (step) => step.value === this.activeStepValue,
    );
    const activeIndex = this.config?.findIndex(
      (step) => step.value === this.activeStepValue,
    );

    if (activeStep) {
      this.stepperService.setStep({
        stepId: activeStep.value,
        sidebarMenu: activeIndex,
      });

      this.stageChange.emit(activeStep.value); // Notify parent of step change
    }
  }

  private goToNextStep(): void {

    const currentIndex = this.config.findIndex(
      (step) => step.value === this.activeStepValue,
    );
    const nextStep = this.config[currentIndex + 1];

    if (nextStep) {
      this.onStepChange(nextStep.value);
    }
    this.stageChange.emit(nextStep.value);
  }

  onStepClick(step: any) {
    this.stageChange.emit(step.value);
  }
}
