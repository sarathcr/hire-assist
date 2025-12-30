import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Option } from '../models/option';

// CONFIGS

interface BaseCustomConfig {
  id: string;
  labelKey: string;
}

// INPUT TEXT
export interface CustomTextInputConfig extends BaseCustomConfig {
  maxlength?: number;
  matPrefix?: string;
  matSuffix?: string;
  readonly?: boolean;
}
// INPUT TEXTAREA
export interface CustomTextareaConfig extends BaseCustomConfig {
  maxlength?: number;
  matPrefix?: string;
  matSuffix?: string;
  readonly?: boolean;
}
// INPUT SELECT
export interface CustomSelectConfig extends BaseCustomConfig {
  options: Option[];
  maxlength?: number;
  matPrefix?: string;
  matSuffix?: string;
  readonly?: boolean;
  disabled?: boolean;
}

// TOGGLE SWITCH
export interface CustomToggleSwitchConfig extends BaseCustomConfig {
  maxlength?: number;
  matPrefix?: string;
  matSuffix?: string;
  readonly?: boolean;
}

//INPUT TEXT CALENDER
export interface CustomInputTextCalenderConfig extends BaseCustomConfig {
  maxlength?: number;
  matPrefix?: string;
  matSuffix?: string;
  readonly?: boolean;
}

export type CustomFormControlConfig =
  | CustomTextInputConfig
  | CustomTextareaConfig
  | CustomSelectConfig
  | CustomToggleSwitchConfig
  | CustomInputTextCalenderConfig;
// | CustomNumberInputConfig;

export interface Metadata {
  validatorsMap: ValidatorsMap;
  configMap?: ConfigMap;
  disabledMap?: DisabledMap;
}

export type ValidatorsMap = Record<string, Validators[]>;

export type DisabledMap = Record<string, boolean>;

export type ConfigMap = Record<string, CustomFormControlConfig>;

export const initialMetadata: Metadata = {
  validatorsMap: {},
  configMap: {},
};
export interface Metadata {
  validatorsMap: ValidatorsMap;
  configMap?: ConfigMap;
  disabledMap?: DisabledMap;
}
// FORM ENTITY
export abstract class FormEntity {
  abstract metadata: Metadata;
}

/** Returns a map of object's property name and his type */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPropertyTypeMap = (obj: any): Record<string, string> => {
  if (obj == null) {
    return {};
  }
  const propertyTypeMap: Record<string, string> = {};
  const properties = Object.getOwnPropertyNames(obj).filter(
    (x) => x !== 'metadata',
  );
  properties.forEach((prop) => {
    const propertyValue = obj[prop];
    const propType = Array.isArray(propertyValue)
      ? 'array'
      : typeof propertyValue;
    propertyTypeMap[prop] = propType;
  });

  return propertyTypeMap;
};

export const buildFormGroup = <T extends FormEntity>(myObj: T): FormGroup => {
  const formBuilder = new FormBuilder();
  const propertyTypeMap = getPropertyTypeMap(myObj);
  const propList = Object.keys(propertyTypeMap);
  const formControls = {};
  for (const prop of propList) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (myObj as any)[prop];
    const type = propertyTypeMap[prop];
    if (type === 'array') {
      const formArray = formBuilder.array([]);
      for (const arrayValue of value) {
        if (arrayValue != null && typeof arrayValue === 'object' && !Array.isArray(arrayValue)) {
          const formGroup = buildFormGroup(arrayValue);
          (formArray as FormArray).push(formGroup);
        } else {
          const formControl = new FormControl(arrayValue);
          (formArray as FormArray).push(formControl);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (formControls as any)[prop] = formArray;
    } else if (type === 'object' && value != null) {
      const innerFg = buildFormGroup(value);
      const formGroup: FormGroup = innerFg;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (formControls as any)[prop] = formGroup;
    } else {
      const validators = myObj.metadata.validatorsMap[prop] || [];
      const disabled = myObj.metadata.disabledMap
        ? myObj.metadata.disabledMap[prop]
        : false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (formControls as any)[prop] = [{ value, disabled }, validators];
    }
  }
  return formBuilder.group(formControls);
};
