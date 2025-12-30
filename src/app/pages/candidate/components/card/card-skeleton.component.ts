import { Component } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-card-skeleton',
  imports: [SkeletonModule],
  template: `<div class="card">
    <div class="card__header">
      <p-skeleton width="8rem" height="2rem" styleClass="card__tag-skeleton" />
    </div>
    <div class="card__content">
      <p>
        <p-skeleton width="10rem" height="1.5rem" styleClass="card__content-skeleton" />
        <p-skeleton width="15rem" height="1.5rem" styleClass="card__content-skeleton" />
      </p>
      <p>
        <p-skeleton width="8rem" height="1.5rem" styleClass="card__content-skeleton" />
        <p-skeleton width="10rem" height="1.5rem" styleClass="card__content-skeleton" />
      </p>
      <p>
        <p-skeleton width="12rem" height="1.5rem" styleClass="card__content-skeleton" />
        <p-skeleton width="5rem" height="1.5rem" styleClass="card__content-skeleton" />
      </p>
      <p>
        <p-skeleton width="7rem" height="1.5rem" styleClass="card__content-skeleton" />
        <p-skeleton width="10rem" height="1.5rem" styleClass="card__content-skeleton" />
      </p>
      <p>
        <p-skeleton width="7rem" height="1.5rem" styleClass="card__content-skeleton" />
        <p-skeleton width="15rem" height="1.5rem" styleClass="card__content-skeleton" />
      </p>
    </div>
    <div class="card__footer">
      <p-skeleton width="8rem" height="2.5rem" styleClass="card__footer-skeleton" />
    </div>
  </div>`,
  styleUrl: './card-skeleton.component.scss',
})
export class CardSkeletonComponent {}

