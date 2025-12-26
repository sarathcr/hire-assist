import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';

@Component({
  selector: 'app-profile-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule, TabsModule],
  template: `
    <div class="profile">
      <!-- Cover Image Skeleton -->
      <div class="cover-image">
        <div class="cover-image__skeleton">
          <p-skeleton
            width="100%"
            height="100%"
            styleClass="cover-image__skeleton-img"
          />
        </div>
      </div>

      <div class="profile__content-wrapper">
        <!-- Sidebar Skeleton -->
        <div class="profile__sidebar">
          <!-- Profile Card Skeleton -->
          <div class="profile__card">
            <div class="profile__circle-container">
              @for (circle of skeletonCircles; track $index) {
                <div class="circle"></div>
              }
            </div>
            <div class="profile__button">
              <p-skeleton shape="circle" width="40px" height="40px" />
            </div>
            <div class="profile__avatar">
              <p-skeleton shape="circle" width="150px" height="150px" />
            </div>
            <h2 class="profile__card__name">
              <p-skeleton width="180px" height="32px" />
            </h2>
            <p class="profile__card__role">
              <p-skeleton width="150px" height="20px" />
            </p>
          </div>

          <!-- Skills Card Skeleton -->
          <div class="profile__skills profile__card">
            <div class="profile__skills__button">
              <p-skeleton shape="circle" width="40px" height="40px" />
            </div>
            <h3 class="profile__skills__title">Expert in:</h3>
            <ul class="profile__skills__list">
              @for (item of skeletonSkills; track $index) {
                <li class="profile__skills__item">
                  <p-skeleton width="80px" height="20px" />
                </li>
              }
            </ul>
          </div>
        </div>

        <!-- Content Skeleton -->
        <div class="profile__content">
          <p-tabs value="0">
            <p-tablist>
              <p-tab value="0">
                <i class="pi pi-user"></i> Basic Details
              </p-tab>
            </p-tablist>
            <p-tabpanels>
              <p-tabpanel value="0">
                <div class="basic-information m-0">
                  <form>
                    <div class="basic-information__field-wrapper">
                      <p-skeleton width="100%" height="56px" />
                      <p-skeleton width="100%" height="56px" />
                    </div>
                    <div class="basic-information__field-wrapper">
                      <p-skeleton width="100%" height="56px" />
                      <p-skeleton width="100%" height="56px" />
                    </div>
                    <div class="basic-information__field-wrapper">
                      <p-skeleton width="100%" height="56px" />
                      <p-skeleton width="100%" height="56px" />
                    </div>
                    <div class="basic-information__btn">
                      <p-skeleton width="180px" height="40px" />
                    </div>
                  </form>
                  <div class="basic-information__interview-schedules">
                    <h3 class="basic-information__interview-schedules__title">
                      Upcoming Interview Schedules
                    </h3>
                    <div class="basic-information__interview-schedules__cards">
                      @for (item of skeletonInterviews; track $index) {
                        <div
                          class="basic-information__interview-schedules__cards__calendar-tile"
                        >
                          <div
                            class="basic-information__interview-schedules__cards__calendar-day"
                          >
                            <p-skeleton width="40px" height="14px" />
                          </div>
                          <div
                            class="basic-information__interview-schedules__cards__calendar-date"
                          >
                            <p-skeleton width="50px" height="18px" />
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
        </div>
      </div>
    </div>
  `,
  styleUrl: './profile-skeleton.component.scss',
})
export class ProfileSkeletonComponent {
  skeletonSkills: number[] = Array.from({ length: 3 });
  skeletonInterviews: number[] = Array.from({ length: 4 });
  skeletonCircles: number[] = Array.from({ length: 15 });
}
