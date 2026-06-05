import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { GlobalFocusTrapService } from './shared/services/global-focus-trap.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'hire-assist-fe';

  constructor(private globalFocusTrapService: GlobalFocusTrapService) {}

  ngOnInit() {
    this.globalFocusTrapService.init();
  }
}
