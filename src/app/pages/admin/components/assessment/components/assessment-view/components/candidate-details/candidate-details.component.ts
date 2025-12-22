import { Component, computed, input } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { CandidateData } from '../../models/manage-duplicate-candidates.model';

@Component({
  selector: 'app-candidate-details',
  imports: [DividerModule],
  templateUrl: './candidate-details.component.html',
  styleUrl: './candidate-details.component.scss',
})
export class CandidateDetailsComponent {
  public data = input<CandidateData>();

  public entries = computed(() => Object.entries(this.data() ?? {}));

  public filteredEntries = computed(() => {
    return this.entries().filter(
      (entry) =>
        entry[0] !== 'panelId' &&
        entry[0] !== 'key' &&
        entry[0] !== 'candidates'
    );
  });

  public getIconForField(fieldName: string): string {
    const fieldLower = fieldName.toLowerCase();
    const iconMap: Record<string, string> = {
      'candidate name': 'pi pi-user',
      'name': 'pi pi-user',
      'email': 'pi pi-envelope',
      'email id': 'pi pi-envelope',
      'mobile': 'pi pi-phone',
      'mobile number': 'pi pi-phone',
      'phone': 'pi pi-phone',
      'address': 'pi pi-map-marker',
      'date': 'pi pi-calendar',
      'dob': 'pi pi-calendar',
      'experience': 'pi pi-briefcase',
      'education': 'pi pi-graduation-cap',
      'skills': 'pi pi-star',
      'location': 'pi pi-map-marker',
      'city': 'pi pi-map-marker',
      'state': 'pi pi-map-marker',
      'country': 'pi pi-globe',
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (fieldLower.includes(key)) {
        return icon;
      }
    }

    return 'pi pi-info-circle';
  }
}
