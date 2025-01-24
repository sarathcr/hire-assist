import {
  Component,
  Input,
  OnChanges,
  OnInit,
  output,
  SimpleChanges,
} from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { Menu, MenuModule } from 'primeng/menu';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [ButtonComponent, ButtonModule, MenuModule, Menu, CommonModule],
  // providers:[]
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent implements OnChanges {
  public startTest = output();

  @Input() hasHeader = false;
  @Input() hasLabel = false;
  @Input() items: MenuItem[] = [];

  public selectedItem = output<string>();

  // LifeCycle
  ngOnChanges(changes: SimpleChanges): void {
    const currentValues = changes['items']?.currentValue;
    if (currentValues) {
      this.setMenuItems(currentValues);
    }
  }

  // Public Events
  public startAssessment() {
    this.startTest.emit();
  }

  public setMenuItems(items: MenuItem[]) {
    items[0].items?.map(item => {
      item.command = () => {
        item.label && this.selectedItem.emit(item.label.toLowerCase());
      };
    });
  }
}
