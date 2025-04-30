import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { StepsModule } from 'primeng/steps';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-table-skeleton',
  imports: [SkeletonModule, StepsModule, TableModule],
  template: `<div class="card table_skeleton">
    <p-table [value]="products" responsiveLayout="scroll">
      <ng-template #header>
        <tr>
          <th><p-skeleton /></th>
          <th><p-skeleton /></th>
          <th><p-skeleton /></th>
          <th><p-skeleton /></th>
        </tr>
      </ng-template>
      <ng-template #body let-product>
        <tr>
          <td><p-skeleton /></td>
          <td><p-skeleton /></td>
          <td><p-skeleton /></td>
          <td><p-skeleton /></td>
        </tr>
      </ng-template>
    </p-table>
  </div>`,
  styleUrl: './table.component.scss',
})
export class TableSkeletonComponent {
  public products = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
}
