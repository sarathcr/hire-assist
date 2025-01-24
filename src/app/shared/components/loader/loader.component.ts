import { Component } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { StoreService } from '../../services/store.service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-loader',
  imports: [ProgressSpinnerModule, AsyncPipe],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss',
})
export class LoaderComponent {
  get loading$(): Observable<boolean> {
    return this.storeService.selectIsLoading();
  }
  constructor(private storeService: StoreService) {}
}
