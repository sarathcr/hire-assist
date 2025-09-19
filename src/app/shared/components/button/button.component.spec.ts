import {
  ComponentFixture,
  ComponentFixtureAutoDetect,
  TestBed,
} from '@angular/core/testing';

import { CommonModule } from '@angular/common';
import { By } from '@angular/platform-browser';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent, CommonModule],
      providers: [{ provide: ComponentFixtureAutoDetect, useValue: true }],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('no title in the DOM after button component', () => {
    const button = fixture.nativeElement.querySelector('button');
    expect(button.textContent.trim()).toEqual('');
  });

  it('should display the correct button label when buttonLabel is provided', async () => {
    fixture.componentRef.setInput('buttonLabel', 'Submit');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.textContent.trim()).toEqual('Submit');
  });

  it('should not display any label when buttonLabel is not provided', async () => {
    fixture.componentRef.setInput('buttonLabel', '');
    fixture.detectChanges();
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.textContent.trim()).toBe('');
  });

  it('should disable the button if disabled is true', () => {
    component.disabled = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBeTrue();
  });

  it('should not disable the button if disabled is false', () => {
    component.disabled = false;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button');
    expect(button.disabled).toBeFalse();
  });

  it('should display icon of the button if it is have icon', async () => {
    fixture.componentRef.setInput('icon', 'pi pi-plus-circle');
    await fixture.whenStable();
    fixture.detectChanges();

    const button = fixture.debugElement.query(
      By.css('p-button'),
    ).componentInstance;
    expect(button.icon).toBe('pi pi-plus-circle');
  });

  it('should not display icon of the button if it is have no icon', async () => {
    fixture.componentRef.setInput('icon', '');
    await fixture.whenStable();
    fixture.detectChanges();
    const button = fixture.debugElement.query(
      By.css('p-button'),
    ).componentInstance;
    expect(button.icon).toBeFalsy();
  });

  it('should display large size of the button if it is have button size as large', async () => {
    fixture.componentRef.setInput('buttonSize', 'large');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('p-button');
    expect(button.classList).toContain('btn-large');
  });

  it('should not display large size of the button if it is not have button size as large ', async () => {
    fixture.componentRef.setInput('buttonSize', 'small');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('p-button');
    expect(button.classList).not.toContain('btn-large');
  });

  it('should display full width of the button if it is have button width as full', async () => {
    fixture.componentRef.setInput('buttonWidth', 'full');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('p-button');
    expect(button.classList).toContain('btn-full');
  });

  it('should not display full width of the button if it is not have button width as full', async () => {
    fixture.componentRef.setInput('buttonWidth', 'medium');
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('p-button');
    expect(button.classList).not.toContain('btn-full');
  });

  it('should load the button if Isloading is true', async () => {
    fixture.componentRef.setInput('isLoading', true);
    await fixture.whenStable();
    const button = fixture.debugElement.query(
      By.css('p-button'),
    ).componentInstance;
    expect(button.loading).toBeTrue();
  });

  it('should not load button when IsLoading is false', async () => {
    fixture.componentRef.setInput('isLoading', false);
    await fixture.whenStable();
    const button = fixture.debugElement.query(
      By.css('p-button'),
    ).componentInstance;
    expect(button.loading).toBeFalse();
  });

  it('should display correct Variant for the button', async () => {
    fixture.componentRef.setInput('buttonVariant', 'outlined');
    await fixture.whenStable();
    const button = fixture.debugElement.query(
      By.css('p-button'),
    ).componentInstance;
    expect(button.variant).toBe('outlined');
  });

  it('should not display Variant for the button if it is undefined', async () => {
    fixture.componentRef.setInput('buttonVariant', undefined);
    await fixture.whenStable();
    const button = fixture.debugElement.query(
      By.css('p-button'),
    ).componentInstance;
    expect(button.variant).toBeUndefined();
  });

  it('should set severity to if it is provided', async () => {
    fixture.componentRef.setInput('buttonSeverity', 'primary');
    await fixture.whenStable();
    const pButton = fixture.debugElement.query(
      By.css('p-button'),
    ).componentInstance;
    expect(pButton.severity).toBe('primary');
  });

  it('should not set severity to if it is not provided', async () => {
    fixture.componentRef.setInput('buttonSeverity', undefined);
    await fixture.whenStable();
    const pButton = fixture.debugElement.query(
      By.css('p-button'),
    ).componentInstance;
    expect(pButton.severity).toBeUndefined();
  });

  it('should dispaly the rounded button if rounded is true', () => {
    component.btnRounded = true;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('p-button');
    expect(button.classList).toContain('btn-rounded');
  });

  it('should not dispaly the rounded button if rounded is false', () => {
    component.btnRounded = false;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('p-button');
    expect(button.classList).not.toContain('btn-rounded');
  });

  it('should emit the correct ID when clicked', async () => {
    fixture.componentRef.setInput('buttonConfig', { id: 123, label: 'Submit' });
    fixture.detectChanges();
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('button');
    spyOn(component.btnClick, 'emit');
    button.click();
    expect(component.btnClick.emit).toHaveBeenCalledWith(123);
  });

  it('should not emit when button is disabled', async () => {
    fixture.componentRef.setInput('buttonConfig', { id: 123, label: 'Click' });
    component.disabled = true;
    await fixture.whenStable();
    spyOn(component.btnClick, 'emit');
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(component.btnClick.emit).not.toHaveBeenCalled();
  });

  it('should emit null when buttonConfig is not provided', async () => {
    fixture.componentRef.setInput('buttonConfig', undefined);
    await fixture.whenStable();
    spyOn(component.btnClick, 'emit');
    const button = fixture.nativeElement.querySelector('button');
    button.click();
    expect(component.btnClick.emit).toHaveBeenCalledWith(null);
  });
});
