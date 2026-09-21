import { TestBed } from '@angular/core/testing';
import { DropdownManagerService, DropdownInstance } from './dropdown-manager.service';

describe('DropdownManagerService', () => {
  let service: DropdownManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DropdownManagerService);
  });

  afterEach(() => {
    service.closeAll();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register an open dropdown and set it as active', () => {
    const dropdown: DropdownInstance = { hide: jasmine.createSpy('hide') };
    service.registerOpen(dropdown);

    expect(service.getActive()).toBe(dropdown);
  });

  it('should automatically close the previously opened dropdown when a new dropdown is opened', () => {
    const dropdown1: DropdownInstance = { hide: jasmine.createSpy('hide1') };
    const dropdown2: DropdownInstance = { hide: jasmine.createSpy('hide2') };

    service.registerOpen(dropdown1);
    expect(service.getActive()).toBe(dropdown1);
    expect(dropdown1.hide).not.toHaveBeenCalled();

    // Opening dropdown2 must automatically close dropdown1
    service.registerOpen(dropdown2);
    expect(dropdown1.hide).toHaveBeenCalledTimes(1);
    expect(service.getActive()).toBe(dropdown2);
    expect(dropdown2.hide).not.toHaveBeenCalled();
  });

  it('should clear active dropdown when registerClose is called for the active one', () => {
    const dropdown: DropdownInstance = { hide: jasmine.createSpy('hide') };
    service.registerOpen(dropdown);

    service.registerClose(dropdown);
    expect(service.getActive()).toBeNull();
  });

  it('should not clear active dropdown when registerClose is called for an inactive one', () => {
    const dropdown1: DropdownInstance = { hide: jasmine.createSpy('hide1') };
    const dropdown2: DropdownInstance = { hide: jasmine.createSpy('hide2') };

    service.registerOpen(dropdown1);
    service.registerClose(dropdown2);

    expect(service.getActive()).toBe(dropdown1);
  });

  it('should close active dropdown when closeActive or closeAll is called', () => {
    const dropdown: DropdownInstance = { hide: jasmine.createSpy('hide') };
    service.registerOpen(dropdown);

    service.closeActive();
    expect(dropdown.hide).toHaveBeenCalledTimes(1);
    expect(service.getActive()).toBeNull();
  });

  it('should close active dropdown on Escape key', () => {
    const dropdown: DropdownInstance = { hide: jasmine.createSpy('hide') };
    service.registerOpen(dropdown);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(escapeEvent);

    expect(dropdown.hide).toHaveBeenCalledTimes(1);
    expect(service.getActive()).toBeNull();
  });

  it('should close active dropdown on outside pointerdown', () => {
    const triggerBtn = document.createElement('button');
    const containerDiv = document.createElement('div');
    const outsideBtn = document.createElement('button');

    document.body.appendChild(triggerBtn);
    document.body.appendChild(containerDiv);
    document.body.appendChild(outsideBtn);

    const dropdown: DropdownInstance = {
      hide: jasmine.createSpy('hide'),
      container: containerDiv,
      target: triggerBtn,
    };

    service.registerOpen(dropdown, triggerBtn);

    // Click outside
    const pointerEvent = new PointerEvent('pointerdown', { bubbles: true });
    outsideBtn.dispatchEvent(pointerEvent);

    expect(dropdown.hide).toHaveBeenCalledTimes(1);
    expect(service.getActive()).toBeNull();

    triggerBtn.remove();
    containerDiv.remove();
    outsideBtn.remove();
  });

  it('should NOT close active dropdown when pointerdown is inside the dropdown container', () => {
    const containerDiv = document.createElement('div');
    const innerItem = document.createElement('button');
    containerDiv.appendChild(innerItem);
    document.body.appendChild(containerDiv);

    const dropdown: DropdownInstance = {
      hide: jasmine.createSpy('hide'),
      container: containerDiv,
    };

    service.registerOpen(dropdown);

    const pointerEvent = new PointerEvent('pointerdown', { bubbles: true });
    innerItem.dispatchEvent(pointerEvent);

    expect(dropdown.hide).not.toHaveBeenCalled();
    expect(service.getActive()).toBe(dropdown);

    containerDiv.remove();
  });

  it('should NOT close active dropdown when pointerdown is on the trigger button itself', () => {
    const triggerBtn = document.createElement('button');
    document.body.appendChild(triggerBtn);

    const dropdown: DropdownInstance = {
      hide: jasmine.createSpy('hide'),
      target: triggerBtn,
    };

    service.registerOpen(dropdown, triggerBtn);

    const pointerEvent = new PointerEvent('pointerdown', { bubbles: true });
    triggerBtn.dispatchEvent(pointerEvent);

    expect(dropdown.hide).not.toHaveBeenCalled();
    expect(service.getActive()).toBe(dropdown);

    triggerBtn.remove();
  });
});
