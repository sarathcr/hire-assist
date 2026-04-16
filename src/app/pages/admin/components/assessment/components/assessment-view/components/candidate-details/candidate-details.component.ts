import { Component, computed, input, output, signal } from '@angular/core';
import { DividerModule } from 'primeng/divider';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { UpperCasePipe } from '@angular/common';
import { TooltipModule } from 'primeng/tooltip';
import { CandidateData } from '../../models/manage-duplicate-candidates.model';

@Component({
  selector: 'app-candidate-details',
  imports: [DividerModule, FormsModule, InputTextModule, ButtonModule, UpperCasePipe, TooltipModule],
  templateUrl: './candidate-details.component.html',
  styleUrl: './candidate-details.component.scss',
})
export class CandidateDetailsComponent {
  public data = input<CandidateData>();
  public isEditable = input<boolean>(false);
  public editField = input<string | null>(null);
  public onUpdate = output<any>();
  public onCancel = output<void>();

  public isExpanded = signal<boolean>(false);
  public editedValue = signal<string>('');
  public localEditKey = signal<string | null>(null);
  public isAadhaarVisible = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  private basicFieldKeys = ['Candidate Name', 'Email Address', 'Mobile Number', 'Aadhaar Number'];

  public basicEntries = computed(() => {
    return this.filteredEntries().filter(entry => this.basicFieldKeys.includes(entry.label));
  });

  public dynamicEntries = computed(() => {
    return this.filteredEntries().filter(entry => !this.basicFieldKeys.includes(entry.label));
  });

  public filteredEntries = computed(() => {
    const rawData = this.data() ?? {};
    const hiddenKeys = [
      'panelId', 'key', 'candidates', 'groupId', 'isInvalidRecord', 
      'failureReason', 'visibleButtonIndices', 'disabledButtonIndices',
      '_id', 'dynamicAnswers', 'type', 'isDuplicateGroup', 
      'isInvalidGroup', 'isDuplicateRecord'
    ];
    
    // Group all entries by their normalized label and score them
    const labelGroups = new Map<string, { key: string, label: string, value: any, score: number }>();
    
    Object.entries(rawData).forEach(([key, value]) => {
      if (hiddenKeys.includes(key)) return;
      
      const label = this.normalizeLabel(key);
      const score = this.calculateKeyScore(key, label);
      
      const existing = labelGroups.get(label);
      if (!existing || score > existing.score) {
        labelGroups.set(label, { key, label, value, score });
      }
    });
    
    return Array.from(labelGroups.values());
  });

  private calculateKeyScore(key: string, label: string): number {
    const lowerKey = key.toLowerCase();
    const lowerLabel = label.toLowerCase();
    
    let score = 0;
    
    // Exact matches with standardized headers get top score
    if (lowerKey === lowerLabel) score += 100;
    
    // Keys with more than one word are usually descriptive headers
    if (key.trim().includes(' ') || key.includes('_')) score += 50;
    
    // Common descriptive header fragments
    if (lowerKey.includes('candidate') || lowerKey.includes('address') || lowerKey.includes('number')) score += 25;
    
    // Generic backend keys are lowest priority
    const genericKeys = ['name', 'email', 'phone', 'contact', 'adhar', 'mobile'];
    if (genericKeys.includes(lowerKey)) score -= 50;
    
    // If the value looks like an ID (short, alphanumeric, etc) and it's mapping to a Name field, penalize it
    if (label === 'Candidate Name' && /^[A-Z0-9]{3,8}$/.test(String(this.data()?.[key]))) {
      score -= 30;
    }
    
    return score;
  }

  private normalizeLabel(key: string): string {
    const lowerKey = (key || '').toLowerCase().trim();
    
    // TIER 1: EXACT OR HIGHLY SPECIFIC MATCHES (Highest Priority)
    if (lowerKey === 'candidate name' || lowerKey === 'candidate_name' || lowerKey === 'fullname' || lowerKey === 'full name' || lowerKey === 'name') return 'Candidate Name';
    if (lowerKey === 'email' || lowerKey === 'email id' || lowerKey === 'email_id' || lowerKey === 'email address' || lowerKey === 'emailaddress') return 'Email Address';
    if (lowerKey === 'aadhaar number' || lowerKey === 'adhar number' || lowerKey === 'aadhaarnumber' || lowerKey === 'adharnumber') return 'Aadhaar Number';
    if (lowerKey === 'mobile number' || lowerKey === 'phone number' || lowerKey === 'contact number' || lowerKey === 'phonenumber' || lowerKey === 'mobilenumber') return 'Mobile Number';

    // TIER 2: ENTITY/INSTITUTION EXCLUSION (Bail out early to prevent mis-mapping to name)
    const entityKeywords = [
      'institution', 'college', 'univ', 'school', 'company', 'org', 'bank', 'office', 'hospital', 
      'firm', 'center', 'centre', 'branch', 'department', 'dept', 'entity', 'provider', 'board'
    ];
    const isEntityField = entityKeywords.some(v => lowerKey.includes(v));
    if (isEntityField) return this.formatLabel(key);

    // TIER 3: FALLBACK BROAD MATCHES
    if (lowerKey.includes('aadhaar') || lowerKey.includes('adhar')) return 'Aadhaar Number';
    if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey === 'contact') return 'Mobile Number';
    if (lowerKey.includes('email')) return 'Email Address';
    if (lowerKey.includes('name') || lowerKey.includes('candidate')) return 'Candidate Name';
    
    return this.formatLabel(key);
  }

  private formatLabel(label: string): string {
    if (!label) return '';
    let formatted = label.replace(/([A-Z])/g, ' $1');
    formatted = formatted.replace(/[_\-]+/g, ' ');
    return formatted
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  public formatValue(label: string, value: any): string {
    if (!value || value === 'N/A') return 'N/A';
    
    const strValue = value.toString();
    if (label === 'Aadhaar Number' && !this.isAadhaarVisible()) {
      return this.maskAadhaar(strValue);
    }
    return strValue;
  }

  private maskAadhaar(value: string): string {
    const cleaned = value.toString().replace(/\s/g, '');
    if (cleaned.length < 12) return value;
    
    // Mask as XXXX XXXX 1234
    const masked = 'XXXX XXXX ' + cleaned.substring(cleaned.length - 4);
    return masked;
  }

  public toggleAadhaarVisibility() {
    this.isAadhaarVisible.set(!this.isAadhaarVisible());
  }

  public toggleExpand() {
    this.isExpanded.set(!this.isExpanded());
  }

  public startEdit(fieldKey: string, currentValue: any) {
    this.errorMessage.set(null);
    this.localEditKey.set(fieldKey);
    this.editedValue.set(currentValue ? currentValue.toString() : '');
  }

  public async saveEdit(fieldKey: string) {
    await this.validateField(fieldKey, this.editedValue());
    if (this.errorMessage()) return;

    const value = this.editedValue().trim();
    const entry = this.filteredEntries().find(e => e.key === fieldKey);
    if (!entry) return;

    const targetLabel = entry.label;
    const rawData = this.data() ?? {};
    const updatedData: any = JSON.parse(JSON.stringify(rawData)); // Deep clone to handle nested objects
    
    // 1. SYNC FLAT PROPERTIES
    Object.keys(updatedData).forEach(key => {
      if (this.normalizeLabel(key) === targetLabel) {
        updatedData[key] = value;
      }
    });

    // 2. SYNC DYNAMIC ANSWERS (if present)
    if (updatedData.dynamicAnswers && typeof updatedData.dynamicAnswers === 'object') {
      Object.keys(updatedData.dynamicAnswers).forEach(key => {
        if (this.normalizeLabel(key) === targetLabel) {
          updatedData.dynamicAnswers[key] = value;
        }
      });
    }

    // 3. ENFORCE STANDARD BACKEND PROPERTIES (Flat)
    if (targetLabel === 'Aadhaar Number') {
      updatedData['aadhaarNumber'] = value;
      ['Aadhar Number', 'adhar number', 'Aadhaar Number', 'aadhaar_number', 'adhar_number', 'Adhaar Number'].forEach(v => {
        if (updatedData[v] !== undefined) updatedData[v] = value;
      });
    }
    
    if (targetLabel === 'Mobile Number') {
      updatedData['phoneNumber'] = value;
      ['Mobile Number', 'Contact Number', 'mobile number', 'phone', 'mobile', 'phoneNumber'].forEach(v => {
        if (updatedData[v] !== undefined) updatedData[v] = value;
      });
    }
    
    if (targetLabel === 'Candidate Name') {
      updatedData['name'] = value;
      ['Candidate Name', 'candidate name', 'full_name', 'Full Name', 'name', 'Fullname'].forEach(v => {
        if (updatedData[v] !== undefined) updatedData[v] = value;
      });
    }
    
    if (targetLabel === 'Email Address') {
      updatedData['email'] = value;
      ['Email Address', 'email address', 'Email ID', 'email id', 'emailAddress', 'Email', 'email_id', 'email'].forEach(v => {
        if (updatedData[v] !== undefined) updatedData[v] = value;
      });
    }

    this.onUpdate.emit(updatedData);
    this.localEditKey.set(null);
    this.errorMessage.set(null);
  }

  public async validateField(fieldKey: string, value: string) {
    const targetLabel = this.normalizeLabel(fieldKey);
    const trimmedValue = (value || '').trim();

    let error: string | null = null;
    if (targetLabel === 'Email Address') {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmedValue)) error = 'Invalid email address format';
    } else if (targetLabel === 'Aadhaar Number') {
      const cleaned = trimmedValue.replace(/\s/g, '');
      if (!/^\d{12}$/.test(cleaned)) {
        error = 'Aadhaar must be exactly 12 digits';
      } else {
        const { validateVerhoeff } = await import('../../../../../../../../shared/utilities/verhoeff.utility');
        if (!validateVerhoeff(cleaned)) error = 'Invalid Aadhaar number (checksum failed)';
      }
    } else if (targetLabel === 'Mobile Number') {
      if (!/^\+?[0-9]{10,12}$/.test(trimmedValue.replace(/\s/g, ''))) {
        error = 'Mobile number must be 10-12 digits';
      }
    } else if (targetLabel === 'Candidate Name') {
      if (trimmedValue.length < 3) error = 'Name must be at least 3 characters';
    }

    this.errorMessage.set(error);
  }

  public cancelEdit() {
    this.localEditKey.set(null);
    this.errorMessage.set(null);
    this.onCancel.emit();
  }

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
      'aadhaar': 'pi pi-id-card',
      'adhar': 'pi pi-id-card',
      'address': 'pi pi-map-marker',
      'date': 'pi pi-calendar',
      'dob': 'pi pi-calendar',
      'experience': 'pi pi-briefcase',
      'education': 'pi pi-graduation-cap',
      'skills': 'pi pi-star',
      'location': 'pi pi-map-marker',
      'city': 'pi pi-map-marker',
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (fieldLower.includes(key)) {
        return icon;
      }
    }

    return 'pi pi-info-circle';
  }
}
