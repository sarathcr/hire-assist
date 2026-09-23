import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-inner-sidebar-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="inner-sidebar inner-sidebar_expand inner-sidebar--skeleton">
      <div class="inner-sidebar__header">
        <div class="inner-sidebar__title">
          <p-skeleton shape="circle" size="14px" />
          <p-skeleton width="115px" height="12px" borderRadius="4px" />
        </div>
        <div class="inner-sidebar__btn inner-sidebar__btn--skeleton">
          <p-skeleton width="12px" height="12px" borderRadius="3px" />
        </div>
      </div>

      <div class="inner-sidebar__skeleton-list">
        @for (item of skeletonItems; track $index) {
          <div
            class="inner-sidebar__skeleton-item"
            [class.inner-sidebar__skeleton-item--active]="$index === 0"
          >
            <div class="inner-sidebar__skeleton-icon">
              <p-skeleton shape="circle" size="18px" />
            </div>
            <div class="inner-sidebar__skeleton-label">
              <p-skeleton [width]="item.width" height="12px" borderRadius="4px" />
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './inner-sidebar.component.scss',
})
export class InnerSideBarSkeletonComponent {
  public itemCount = input<number>(5);

  private readonly defaultWidths = [
    '75px',
    '110px',
    '100px',
    '85px',
    '70px',
    '95px',
    '80px',
  ];

  public get skeletonItems(): { width: string }[] {
    const count = this.itemCount() || 5;
    return Array.from({ length: count }, (_, i) => ({
      width: this.defaultWidths[i % this.defaultWidths.length],
    }));
  }
}
