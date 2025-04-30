import { Component } from '@angular/core';
import { Menu } from 'primeng/menu';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-inner-sidebar-skeleton',
  imports: [SkeletonModule, Menu],
  template: `<div class="inner-sidebar">
    <span
      class="pi inner-sidebar__btn inner-sidebar__btn_skeleton inner-sidebar__btn_close"
    >
      <p-skeleton width="2rem" height="1.5rem" />
    </span>
    <p-menu [model]="items" class="inner-sidebar_skeleton">
      <ng-template #item let-item>
        @if (item) {
          <a class="p-menu-item-link">
            <p-skeleton width="8rem" />
          </a>
        }
      </ng-template>
    </p-menu>
  </div>`,
  styleUrl: './inner-sidebar.component.scss',
})
export class InnerSideBarSkeletonComponent {
  public config = [1, 2, 3];
  public items = [
    {
      label: 'Item 1',
      icon: 'pi pi-fw pi-plus',
      command: () => {
        console.log('Item 1 clicked');
      },
    },
    {
      label: 'Item 2',
      icon: 'pi pi-fw pi-plus',
      command: () => {
        console.log('Item 2 clicked');
      },
    },
    {
      label: 'Item 3',
      icon: 'pi pi-fw pi-plus',
      command: () => {
        console.log('Item 3 clicked');
      },
    },
  ];
}
