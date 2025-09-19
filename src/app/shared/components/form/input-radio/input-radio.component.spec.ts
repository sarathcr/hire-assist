import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputRadioComponent } from './input-radio.component';
import { By } from '@angular/platform-browser';
import { Options } from '../../../../pages/candidate/models/candidate-test-question-set.model';

describe('InputRadioComponent', () => {
  let component: InputRadioComponent;
  let fixture: ComponentFixture<InputRadioComponent>;

  const baseOption: Partial<Options> = {
    id: 1,
    optionText: 'Option A',
    hasAttachments: false,
  };

  const setupComponent = (optionOverride: Partial<Options>) => {
    fixture = TestBed.createComponent(InputRadioComponent);
    component = fixture.componentInstance;
    component.option = { ...baseOption, ...optionOverride } as Options;
    component.selectedValue = '';
    component.groupName = 'testGroup';
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputRadioComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    setupComponent({});
    expect(component).toBeTruthy();
  });

  it('should render label when optionText is present', () => {
    setupComponent({ optionText: 'Option A' });
    const label = fixture.debugElement.query(By.css('label'));
    expect(label).toBeTruthy();
    expect(label.nativeElement.textContent.trim()).toBe('Option A');
  });

  it('should render image when optionText is empty and hasAttachments is true with url provided', () => {
    setupComponent({
      optionText: '',
      hasAttachments: true,
      url: 'https://example.com/image.png',
    });
    const img = fixture.debugElement.query(By.css('img'));
    expect(img).toBeTruthy();
    expect(img.attributes['alt']).toBe('option image');
    expect(img.attributes['src']).toBe('https://example.com/image.png');
  });

  it('should not render label or image when optionText is empty and hasAttachments is false', () => {
    setupComponent({ optionText: '', hasAttachments: false });
    const label = fixture.debugElement.query(By.css('label'));
    const img = fixture.debugElement.query(By.css('img'));
    expect(label).toBeNull();
    expect(img).toBeNull();
  });

  it('should handle undefined optionText and hasAttachments', () => {
    setupComponent({
      optionText: undefined,
      hasAttachments: undefined,
    });
    const label = fixture.debugElement.query(By.css('label'));
    const img = fixture.debugElement.query(By.css('img'));
    expect(label).toBeNull();
    expect(img).toBeNull();
  });

  it('should handle null optionText and hasAttachments', () => {
    setupComponent({
      optionText: null as unknown as string,
      hasAttachments: undefined,
    });
    const label = fixture.debugElement.query(By.css('label'));
    const img = fixture.debugElement.query(By.css('img'));
    expect(label).toBeNull();
    expect(img).toBeNull();
  });

  it('should emit selectedValueChange when radio value changes', () => {
    setupComponent({});
    spyOn(component.selectedValueChange, 'emit');
    component.onValueChange(1);
    expect(component.selectedValueChange.emit).toHaveBeenCalledWith(
      jasmine.any(Number),
    );
    expect(component.selectedValueChange.emit).toHaveBeenCalledWith(1);
  });

  it('should bind selectedValue properly to ngModel', () => {
    setupComponent({});
    component.selectedValue = 1;
    fixture.detectChanges();
    expect(component.selectedValue).toBe(1);
  });

  it('should generate proper inputId and name', () => {
    setupComponent({});
    expect(component.option.id).toBe(1);
    expect(component.option.optionText).toBe('Option A');
    const input = fixture.debugElement.query(By.css('input[type="radio"]'));
    expect(input.attributes['id']).toBe('option-1');
    expect(input.attributes['name']).toBe('Option A');
  });

  it('should fallback gracefully when option.id is undefined', () => {
    setupComponent({ id: undefined });
    const radio = fixture.debugElement.query(By.css('p-radiobutton'));
    expect(radio.componentInstance.inputId).toBe('option-undefined');
  });

  it('should fallback gracefully when optionText is undefined', () => {
    setupComponent({ optionText: undefined });
    const radio = fixture.debugElement.query(By.css('p-radiobutton'));
    expect(radio.componentInstance.name).toBeUndefined();
  });
  it('should render only label when optionText is non-empty and hasAttachments is false', () => {
    setupComponent({ optionText: 'Only Label', hasAttachments: false });
    const label = fixture.debugElement.query(By.css('label'));
    const img = fixture.debugElement.query(By.css('img'));
    expect(label).toBeTruthy();
    expect(img).toBeNull();
  });

  it('should render only image when optionText is empty and hasAttachments is true with valid url', () => {
    setupComponent({
      optionText: '',
      hasAttachments: true,
      url: 'https://example.com/img.png',
    });
    const label = fixture.debugElement.query(By.css('label'));
    const img = fixture.debugElement.query(By.css('img'));
    expect(label).toBeNull();
    expect(img).toBeTruthy();
    expect(img.attributes['src']).toBe('https://example.com/img.png');
  });

  it('should not render image when optionText is empty and hasAttachments is true but url is missing', () => {
    setupComponent({
      optionText: '',
      hasAttachments: true,
      url: '',
    });
    const img = fixture.debugElement.query(By.css('img'));
    expect(img).toBeNull();
  });

  it('should not render image when optionText is empty and hasAttachments is true but url is undefined', () => {
    setupComponent({
      optionText: '',
      hasAttachments: true,
      url: undefined,
    });
    const img = fixture.debugElement.query(By.css('img'));
    expect(img).toBeNull();
  });

  it('should not render anything when optionText is empty and hasAttachments is false', () => {
    setupComponent({
      optionText: '',
      hasAttachments: false,
      url: '',
    });
    const label = fixture.debugElement.query(By.css('label'));
    const img = fixture.debugElement.query(By.css('img'));
    expect(label).toBeNull();
    expect(img).toBeNull();
  });

  it('should render image when optionText is undefined and hasAttachments is true with valid url', () => {
    setupComponent({
      optionText: undefined,
      hasAttachments: true,
      url: 'https://example.com/img.png',
    });
    const img = fixture.debugElement.query(By.css('img'));
    expect(img).toBeTruthy();
    expect(img.attributes['src']).toBe('https://example.com/img.png');
  });

  it('should render image when optionText is null and hasAttachments is true with valid url', () => {
    setupComponent({
      optionText: null as unknown as string,
      hasAttachments: true,
      url: 'https://example.com/img.png',
    });
    const img = fixture.debugElement.query(By.css('img'));
    expect(img).toBeTruthy();
    expect(img.attributes['src']).toBe('https://example.com/img.png');
  });
});
