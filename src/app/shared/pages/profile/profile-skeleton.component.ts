import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-profile-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonModule],
  template: `
    <div class="sk-profile">

      <!-- Hero -->
      <div class="sk-profile__hero">
        <p-skeleton width="100%" height="100%" />
      </div>

      <!-- Identity strip -->
      <div class="sk-profile__identity">
        <div class="sk-profile__identity-inner">
          <div class="sk-profile__avatar">
            <p-skeleton shape="circle" width="112px" height="112px" />
          </div>
          <div class="sk-profile__identity-info">
            <p-skeleton width="80%" height="28px" styleClass="mb-3" [style]="{ 'max-width': '240px' }" />
            <p-skeleton width="60%" height="18px" styleClass="mb-3" [style]="{ 'max-width': '160px' }" />
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;justify-content:center">
              <p-skeleton width="180px" height="28px" borderRadius="99px" />
              <p-skeleton width="130px" height="28px" borderRadius="99px" />
            </div>
          </div>
          <div class="sk-profile__actions">
            <p-skeleton width="130px" height="40px" borderRadius="10px" />
          </div>
        </div>
      </div>

      <!-- Content grid -->
      <div class="sk-profile__grid">

        <!-- Left col -->
        <div class="sk-profile__col">
          <div class="sk-profile__card">
            <div class="sk-profile__card-head">
              <p-skeleton width="36px" height="36px" borderRadius="10px" />
              <p-skeleton width="140px" height="20px" />
            </div>
            @for (i of [1,2,3,4,5]; track $index) {
              <div style="padding:.85rem 0;border-bottom:1px solid #f8fafc">
                <p-skeleton width="80px" height="11px" styleClass="mb-2" />
                <p-skeleton width="180px" height="15px" />
              </div>
            }
          </div>

          <div class="sk-profile__card">
            <div class="sk-profile__card-head">
              <p-skeleton width="36px" height="36px" borderRadius="10px" />
              <p-skeleton width="130px" height="20px" />
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:.5rem;padding-top:.5rem">
              @for (i of [1,2,3]; track $index) {
                <p-skeleton width="80px" height="30px" borderRadius="99px" />
              }
            </div>
          </div>
        </div>

        <!-- Right col -->
        <div class="sk-profile__col">
          <div class="sk-profile__card">
            <div class="sk-profile__card-head">
              <p-skeleton width="36px" height="36px" borderRadius="10px" />
              <p-skeleton width="180px" height="20px" />
            </div>
            <div style="text-align:center;padding:3rem 1.5rem;display:flex;flex-direction:column;align-items:center;gap:.75rem">
              <p-skeleton shape="circle" width="64px" height="64px" styleClass="mb-2" />
              <p-skeleton width="90%" height="22px" [style]="{ 'max-width': '260px' }" />
              <p-skeleton width="100%" height="36px" [style]="{ 'max-width': '340px' }" />
              <p-skeleton width="140px" height="38px" borderRadius="9px" />
            </div>
          </div>

          <div style="display:flex;gap:1.5rem">
            <div class="sk-profile__card" style="flex:1">
              <div class="sk-profile__card-head">
                <p-skeleton width="36px" height="36px" borderRadius="10px" />
                <p-skeleton width="80px" height="20px" />
              </div>
              <div class="sk-profile__upload">
                <p-skeleton width="48px" height="48px" borderRadius="12px" styleClass="mb-2" />
                <p-skeleton width="140px" height="16px" styleClass="mb-1" />
                <p-skeleton width="110px" height="13px" />
              </div>
            </div>

            <div class="sk-profile__card" style="flex:1">
              <div class="sk-profile__card-head">
                <p-skeleton width="36px" height="36px" borderRadius="10px" />
                <p-skeleton width="130px" height="20px" />
              </div>
              <div style="display:flex;align-items:center;gap:1.25rem;padding-top:.5rem">
                <p-skeleton shape="circle" width="90px" height="90px" />
                <div style="flex:1">
                  <p-skeleton width="100px" height="15px" styleClass="mb-3" />
                  @for (i of [1,2,3,4]; track $index) {
                    <p-skeleton width="160px" height="12px" styleClass="mb-2" />
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .sk-profile {
      min-height: 100vh;
      background: #f1f5f9;
    }
    .sk-profile__hero {
      height: 220px;
      overflow: hidden;
      @media (max-width: 768px) { height: 160px; }
    }
    .sk-profile__identity {
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0 2rem;
      @media (max-width: 768px) { padding: 0 1rem; }
    }
    .sk-profile__identity-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: flex-end;
      gap: 1.5rem;
      padding-bottom: 1.25rem;
      @media (max-width: 768px) {
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding-bottom: 2rem;
      }
    }
    .sk-profile__identity-info { flex: 1; padding-top: .75rem; }
    .sk-profile__avatar { 
      margin-top: -52px; 
      @media (max-width: 768px) { margin-top: -44px; }
    }
    .sk-profile__actions { padding-top: 1rem; }
    .sk-profile__grid {
      max-width: 1200px;
      margin: 1.75rem auto;
      padding: 0 2rem 3rem;
      display: grid;
      grid-template-columns: 340px 1fr;
      gap: 1.5rem;
      @media (max-width: 1024px) {
        grid-template-columns: 1fr;
        padding: 0 1rem 3rem;
      }
    }
    .sk-profile__col { display: flex; flex-direction: column; gap: 1.5rem; }
    .sk-profile__card {
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06);
      padding: 1.5rem;
    }
    .sk-profile__card-head {
      display: flex;
      align-items: center;
      gap: .75rem;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .sk-profile__upload {
      border: 2px dashed #e2e8f0;
      border-radius: 12px;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: .4rem;
    }
  `]
})
export class ProfileSkeletonComponent {}
