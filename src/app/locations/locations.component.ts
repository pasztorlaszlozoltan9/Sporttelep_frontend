import { AfterViewInit, Component, ElementRef, OnDestroy } from '@angular/core';
import { LocService } from '../shared/loc.service';
import flatpickr from 'flatpickr';
import { Hungarian } from 'flatpickr/dist/l10n/hu.js';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [],
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.css']
})
export class LocationsComponent {
  locList!: any;
  private pickerInstances: any[] = [];

  constructor(
    private api: LocService,
    private hostRef: ElementRef<HTMLElement>
  ) {  }

  ngOnInit() {
    this.getLocation()
}

  ngAfterViewInit(): void {
    this.initializeLegacyPickers();
  }

  ngOnDestroy(): void {
    this.pickerInstances.forEach((instance) => instance?.destroy());
    this.pickerInstances = [];
  }

  getLocation() {
    this.api.getLocation().subscribe({
      next: (locs: any) => {
        console.log(locs.data)
        this.locList = locs.data;
      },
      error: () => {},
    });
  }

  private initializeLegacyPickers(): void {
    const root = this.hostRef.nativeElement;
    const dateInputs = Array.from(root.querySelectorAll('input[type="date"]')) as HTMLInputElement[];
    const timeInputs = Array.from(root.querySelectorAll('input[type="time"]')) as HTMLInputElement[];

    dateInputs.forEach((input) => {
      this.pickerInstances.push(this.createDatePicker(input));
    });

    timeInputs.forEach((input) => {
      this.pickerInstances.push(this.createTimePicker(input));
    });
  }

  private createDatePicker(input: HTMLInputElement): any {
    return flatpickr(input, {
      locale: Hungarian,
      dateFormat: 'Y-m-d',
      disableMobile: true,
      appendTo: input.parentElement ?? undefined,
      defaultDate: this.normalizeDate(input.value) || undefined
    });
  }

  private createTimePicker(input: HTMLInputElement): any {
    const pickerState = {
      confirmed: false,
      initialValue: this.normalizeTime(input.value),
      pendingValue: this.normalizeTime(input.value)
    };

    return flatpickr(input, {
      locale: Hungarian,
      enableTime: true,
      noCalendar: true,
      time_24hr: true,
      dateFormat: 'H:i',
      minuteIncrement: 15,
      disableMobile: true,
      appendTo: input.parentElement ?? undefined,
      defaultDate: pickerState.initialValue || undefined,
      onReady: (_selectedDates, _timeStr, instance) => {
        this.ensureTimeConfirmButton(instance, pickerState, input);
      },
      onOpen: (_selectedDates, _timeStr, instance) => {
        pickerState.confirmed = false;
        pickerState.initialValue = this.normalizeTime(input.value);
        pickerState.pendingValue = pickerState.initialValue;
        this.ensureTimeConfirmButton(instance, pickerState, input);
      },
      onChange: (_selectedDates, timeStr) => {
        pickerState.pendingValue = this.normalizeTime(timeStr);
      },
      onValueUpdate: (_selectedDates, timeStr) => {
        pickerState.pendingValue = this.normalizeTime(timeStr);
      },
      onClose: (_selectedDates, _timeStr, instance) => {
        if (pickerState.confirmed) {
          pickerState.confirmed = false;
          return;
        }

        if (pickerState.initialValue) {
          instance.setDate(pickerState.initialValue, false, 'H:i');
        } else {
          instance.clear(false);
          input.value = '';
        }
      }
    });
  }

  private ensureTimeConfirmButton(
    instance: any,
    pickerState: { confirmed: boolean; initialValue: string; pendingValue: string },
    input: HTMLInputElement
  ): void {
    const calendar = instance?.calendarContainer as HTMLElement | undefined;
    if (!calendar || calendar.querySelector('.fp-confirm-btn')) {
      return;
    }

    const timeContainer = calendar.querySelector('.flatpickr-time') as HTMLElement | null;
    if (!timeContainer) {
      return;
    }

    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = 'fp-confirm-btn';
    confirmButton.textContent = '✓';
    confirmButton.addEventListener('click', () => {
      const liveValue = this.normalizeTime(String((instance?.input as HTMLInputElement | undefined)?.value ?? ''));
      const committedValue = liveValue || pickerState.pendingValue || pickerState.initialValue || '';
      pickerState.pendingValue = committedValue;
      pickerState.initialValue = committedValue;
      pickerState.confirmed = true;
      input.value = committedValue;
      instance.close();
    });

    timeContainer.appendChild(confirmButton);
  }

  private normalizeDate(value: string | null | undefined): string {
    const text = String(value ?? '').trim();
    return text.includes('T') ? text.split('T')[0] : text;
  }

  private normalizeTime(value: string | null | undefined): string {
    return String(value ?? '').trim();
  }
}