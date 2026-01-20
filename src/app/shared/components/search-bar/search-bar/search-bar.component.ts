import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, IconField, InputIcon],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Search...';
  @Output() search = new EventEmitter<string>();

  searchControl = new FormControl('');
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.search.emit(value ?? '');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
