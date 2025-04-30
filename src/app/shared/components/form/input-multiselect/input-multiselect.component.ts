import { Component, input, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MultiSelect } from 'primeng/multiselect';
import { Subscription } from 'rxjs';
import { Option } from '../../../models/app-state.models';
import { CustomFormControlConfig, CustomSelectConfig } from '../../../utilities/form.utility';
import { BaseFormComponent } from '../base-form/base-form.component';

@Component({
  selector: 'app-input-multiselect',
  imports: [ReactiveFormsModule,MultiSelect,FloatLabelModule],
  templateUrl: './input-multiselect.component.html',
  styleUrl: './input-multiselect.component.scss'
})
export class InputMultiselectComponent extends BaseFormComponent implements OnInit, OnChanges, OnDestroy {
      @Input() formGroup!: FormGroup;
      @Input() config!: CustomFormControlConfig;
      @Input() dynamicSuffix!: string;

      public formControl!: FormControl<string>;
      public inputTextConfig!: CustomSelectConfig;
      public items = input<Option[]>(); 
      public selectedItems = input<Option[]>(); 
      public placeholder = input();
      public options: Option[] = [];
       private subs!: Subscription;

    ngOnInit() {
      this.inputTextConfig = this.config as CustomSelectConfig;
      this.options = (this.config as CustomSelectConfig).options || [];
      this.formControl = this.formGroup.get(this.config.id) as FormControl;
    }

      ngOnChanges(changes: SimpleChanges) {
        if (changes && changes['config'] && changes['config'].currentValue) {
          this.options = changes['config'].currentValue.options;
        }
      }
    
      ngOnDestroy(): void {
        this.subs?.unsubscribe();
      }

}
