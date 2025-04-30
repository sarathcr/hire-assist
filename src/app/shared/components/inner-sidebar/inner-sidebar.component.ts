import { Component, input, OnInit } from '@angular/core';
import { BaseComponent } from '../base/base.component';
import { MenuItem } from 'primeng/api';
import { StepperService } from '../../../pages/admin/components/assessment/services/stepper.service';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { Menu } from 'primeng/menu';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-inner-sidebar',
  imports: [Menu, RouterLink, ButtonModule, NgClass],
  templateUrl: './inner-sidebar.component.html',
  styleUrl: './inner-sidebar.component.scss',
})
export class InnerSidebarComponent extends BaseComponent implements OnInit {
  public showMenu = true;
  public activeMenuItem!: number;

  public items = input<MenuItem[]>();

  constructor(private stepperService: StepperService) {
    super();
  }

  ngOnInit(): void {
    this.setActiveMenu();
  }

  // Private methods
  private setActiveMenu(): void {
    const sub = this.stepperService.currentStep$.subscribe((step) => {
      if (step !== null) {
        this.activeMenuItem = step.sidebarMenu;
      }
    });
    this.subscriptionList.push(sub);
  }
}
