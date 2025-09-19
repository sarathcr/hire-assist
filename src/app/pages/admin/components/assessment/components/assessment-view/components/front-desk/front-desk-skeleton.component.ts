import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-frontdesk-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="frontdesk">
      <!-- Multiselect Field -->
      <div class="frontdesk__field">
        <p-skeleton height="3rem" width="100%" />
      </div>
      <!-- Submit Button -->
      <div class="frontdesk__button ">
        <p-skeleton height="2.5rem" width="8rem" />
      </div>
    </div>
  `,
  styleUrl: './front-desk.component.scss',
})
export class FrontdeskSkeletonComponent {}
