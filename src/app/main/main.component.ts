import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SportService } from '../shared/sport.service';
import { LocService } from '../shared/loc.service';
import { FieldService } from '../shared/field.service';
import { FieldBookingWindowService } from '../shared/fieldbookingwindow.service';
import { PriceService } from '../shared/price.service';
import { BookingService } from '../shared/booking.service';
import Swal from 'sweetalert2';
import flatpickr from 'flatpickr';
import { Hungarian } from 'flatpickr/dist/l10n/hu.js';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly welcomeSessionKey = 'main_welcome_popup_shown';
  private readonly weekdayLabels = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];

  sportList: any[] = [];
  locList: any[] = [];
  fieldsList: any[] = [];
  fieldBookingWindowsList: any[] = [];
  pricesList: any[] = [];
  bookingsList: any[] = [];
  userId: number | null = null;

  selectedSportId: number | null = null;
  selectedFilterDate: string = '';
  selectedLocationId: number | null = null;
  selectedFieldId: number | null = null;
  selectedDate: string | null = null;
  selectedStartTime: string = '';
  selectedEndTime: string = '';
  selectedSlot: any = null;
  selectedSlotKey: string | null = null;
  selectedTimeValidationMessage: string = '';
  selectedPrice: any = null;
  selectedPriceId: number | null = null;
  private readonly bookingDurationMinutes = 60;
  private readonly bookingStepMinutes = 15;
  readonly todayDate: string = new Date().toISOString().split('T')[0];
  private datePickerInstance: any = null;
  private bookingDatePickerInstance: any = null;
  private bookingStartTimePickerInstance: any = null;
  private bookingEndTimePickerInstance: any = null;

  @ViewChild('headerDatePicker')
  headerDatePicker?: ElementRef<HTMLInputElement>;

  @ViewChild('bookingDatePicker')
  bookingDatePicker?: ElementRef<HTMLInputElement>;

  @ViewChild('bookingStartTimePicker')
  bookingStartTimePicker?: ElementRef<HTMLInputElement>;

  @ViewChild('bookingEndTimePicker')
  bookingEndTimePicker?: ElementRef<HTMLInputElement>;

  constructor(
    private sportService: SportService,
    private locService: LocService,
    private fieldService: FieldService,
    private fieldBookingWindowService: FieldBookingWindowService,
    private priceService: PriceService,
    private bookingService: BookingService,
    private router: Router
  ) { }

  

  ngOnInit(): void {
    this.loadAllData();
    this.loadUserIdFromToken();
    this.showWelcomePopupIfNeeded();
  }

  ngAfterViewInit(): void {
    this.initializeHeaderDatePicker();
    this.initializeBookingDatePicker();
    this.initializeBookingTimePickers();
  }

  ngOnDestroy(): void {
    this.datePickerInstance?.destroy();
    this.bookingDatePickerInstance?.destroy();
    this.bookingStartTimePickerInstance?.destroy();
    this.bookingEndTimePickerInstance?.destroy();
  }

  private initializeHeaderDatePicker(): void {
    const input = this.headerDatePicker?.nativeElement;
    if (!input) {
      return;
    }

    this.datePickerInstance = flatpickr(input, {
      locale: Hungarian,
      dateFormat: 'Y-m-d',
      disableMobile: true,
      appendTo: input.parentElement ?? undefined,
      defaultDate: this.selectedFilterDate || undefined,
      onChange: (_selectedDates, dateStr) => {
        this.selectedFilterDate = this.normalizeDateStr(dateStr);
        this.resetSelectionChain();
      }
    });
  }

  private initializeBookingDatePicker(): void {
    const input = this.bookingDatePicker?.nativeElement;
    if (!input) {
      return;
    }

    this.bookingDatePickerInstance?.destroy();

    this.bookingDatePickerInstance = flatpickr(input, {
      locale: Hungarian,
      dateFormat: 'Y-m-d',
      minDate: this.todayDate,
      disableMobile: true,
      appendTo: input.parentElement ?? undefined,
      defaultDate: this.selectedDate || undefined,
      onChange: (_selectedDates, dateStr) => {
        this.onSelectedDateInput(dateStr);
      }
    });
  }

  private initializeBookingTimePickers(): void {
    const startInput = this.bookingStartTimePicker?.nativeElement;
    const endInput = this.bookingEndTimePicker?.nativeElement;

    if (startInput) {
      const startPickerState = {
        confirmed: false,
        initialValue: this.selectedStartTime || '',
        pendingValue: this.selectedStartTime || ''
      };

      this.bookingStartTimePickerInstance?.destroy();
      this.bookingStartTimePickerInstance = flatpickr(startInput, {
        locale: Hungarian,
        enableTime: true,
        noCalendar: true,
        time_24hr: true,
        dateFormat: 'H:i',
        minuteIncrement: this.bookingStepMinutes,
        disableMobile: true,
        appendTo: startInput.parentElement ?? undefined,
        defaultDate: this.selectedStartTime || undefined,
        onReady: (_selectedDates, _timeStr, instance) => {
          this.ensureTimePickerConfirmButton(instance, (value) => this.onSelectedStartTimeInput(value), startPickerState);
        },
        onOpen: (_selectedDates, _timeStr, instance) => {
          startPickerState.confirmed = false;
          startPickerState.initialValue = this.selectedStartTime || '';
          startPickerState.pendingValue = startPickerState.initialValue;
          this.ensureTimePickerConfirmButton(instance, (value) => this.onSelectedStartTimeInput(value), startPickerState);
        },
        onChange: (_selectedDates, timeStr) => {
          startPickerState.pendingValue = timeStr;
        },
        onValueUpdate: (_selectedDates, timeStr) => {
          startPickerState.pendingValue = timeStr;
        },
        onClose: (_selectedDates, _timeStr, instance) => {
          if (startPickerState.confirmed) {
            startPickerState.confirmed = false;
            return;
          }

          this.onSelectedStartTimeInput(startPickerState.initialValue);

          if (startPickerState.initialValue) {
            instance.setDate(startPickerState.initialValue, false, 'H:i');
          } else {
            instance.clear(false);
            (instance.input as HTMLInputElement).value = '';
          }
        }
      });
    }

    if (endInput) {
      const endPickerState = {
        confirmed: false,
        initialValue: this.selectedEndTime || '',
        pendingValue: this.selectedEndTime || ''
      };

      this.bookingEndTimePickerInstance?.destroy();
      this.bookingEndTimePickerInstance = flatpickr(endInput, {
        locale: Hungarian,
        enableTime: true,
        noCalendar: true,
        time_24hr: true,
        dateFormat: 'H:i',
        minuteIncrement: this.bookingStepMinutes,
        disableMobile: true,
        appendTo: endInput.parentElement ?? undefined,
        defaultDate: this.selectedEndTime || undefined,
        onReady: (_selectedDates, _timeStr, instance) => {
          this.ensureTimePickerConfirmButton(instance, (value) => this.onSelectedEndTimeInput(value), endPickerState);
        },
        onOpen: (_selectedDates, _timeStr, instance) => {
          endPickerState.confirmed = false;
          endPickerState.initialValue = this.selectedEndTime || '';
          endPickerState.pendingValue = endPickerState.initialValue;
          this.ensureTimePickerConfirmButton(instance, (value) => this.onSelectedEndTimeInput(value), endPickerState);
        },
        onChange: (_selectedDates, timeStr) => {
          endPickerState.pendingValue = timeStr;
        },
        onValueUpdate: (_selectedDates, timeStr) => {
          endPickerState.pendingValue = timeStr;
        },
        onClose: (_selectedDates, _timeStr, instance) => {
          if (endPickerState.confirmed) {
            endPickerState.confirmed = false;
            return;
          }

          this.onSelectedEndTimeInput(endPickerState.initialValue);

          if (endPickerState.initialValue) {
            instance.setDate(endPickerState.initialValue, false, 'H:i');
          } else {
            instance.clear(false);
            (instance.input as HTMLInputElement).value = '';
          }
        }
      });
    }
  }

  private ensureTimePickerConfirmButton(
    instance: any,
    onConfirm: (value: string) => void,
    pickerState: { confirmed: boolean; initialValue: string; pendingValue: string }
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
    confirmButton.setAttribute('aria-label', 'Idopont valasztas kesz');
    confirmButton.addEventListener('click', () => {
      const liveValue = String((instance?.input as HTMLInputElement | undefined)?.value ?? '').trim();
      const committedValue = liveValue || pickerState.pendingValue || pickerState.initialValue || '';
      pickerState.pendingValue = committedValue;
      pickerState.initialValue = committedValue;
      pickerState.confirmed = true;
      onConfirm(committedValue);
      instance.close();
    });

    timeContainer.appendChild(confirmButton);
  }

  private refreshBookingPickersWhenVisible(): void {
    setTimeout(() => {
      this.initializeBookingDatePicker();
      this.initializeBookingTimePickers();
    });
  }

  private destroyBookingPickers(): void {
    this.bookingDatePickerInstance?.destroy();
    this.bookingDatePickerInstance = null;
    this.bookingStartTimePickerInstance?.destroy();
    this.bookingStartTimePickerInstance = null;
    this.bookingEndTimePickerInstance?.destroy();
    this.bookingEndTimePickerInstance = null;
  }

  loadUserIdFromToken(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // JWT token format: header.payload.signature
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          // Decode the payload (second part)
          const payload = JSON.parse(atob(tokenParts[1]));
          // Extract user ID - typically in 'sub' or 'id' field
          this.userId = payload.sub || payload.id || null;
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        this.userId = null;
      }
    }
  }

  loadAllData(): void {
    this.sportService.getSport().subscribe({ next: (res: any) => this.sportList = res.data ?? res ?? [] });
    this.locService.getLocation().subscribe({ next: (res: any) => this.locList = res.data ?? res ?? [] });
    this.fieldService.getField().subscribe({ next: (res: any) => this.fieldsList = res.data ?? res ?? [] });
    this.fieldBookingWindowService.getFieldBookingWindows().subscribe({ next: (res: any) => this.fieldBookingWindowsList = res.data ?? res ?? [] });
    this.priceService.getPrices().subscribe({ next: (res: any) => this.pricesList = res.data ?? res ?? [] });
    this.bookingService.getBookings().subscribe({ next: (res: any) => this.bookingsList = res.data ?? res ?? [] });
  }
  selectSport(sport: any): void {
    const clickedSportId = sport?.id ?? null;

    if (this.selectedSportId === clickedSportId) {
      this.selectedSportId = null;
      this.resetSelectionChain();
      return;
    }

    this.selectedSportId = clickedSportId;
    this.resetSelectionChain();
  }

  clearDateFilter(): void {
    this.selectedFilterDate = '';
    this.datePickerInstance?.clear();
    this.resetSelectionChain();
  }

  clearBookingDateTimeSelection(): void {
    this.selectedDate = null;
    this.selectedStartTime = '';
    this.selectedEndTime = '';
    this.selectedSlot = null;
    this.selectedSlotKey = null;
    this.selectedTimeValidationMessage = '';
    this.bookingDatePickerInstance?.clear();
    this.bookingStartTimePickerInstance?.clear();
    this.bookingEndTimePickerInstance?.clear();
  }

  private resetSelectionChain(): void {
    this.selectedLocationId = null;
    this.selectedFieldId = null;
    this.selectedDate = null;
    this.selectedStartTime = '';
    this.selectedEndTime = '';
    this.selectedSlot = null;
    this.selectedSlotKey = null;
    this.selectedTimeValidationMessage = '';
    this.selectedPrice = null;
    this.selectedPriceId = null;
  }

  selectLocation(loc: any): void {
    const clickedLocationId = loc?.id ?? null;

    if (this.selectedLocationId === clickedLocationId) {
      this.selectedLocationId = null;
      this.selectedFieldId = null;
      this.selectedDate = null;
      this.selectedStartTime = '';
      this.selectedEndTime = '';
      this.selectedSlot = null;
      this.selectedSlotKey = null;
      this.selectedTimeValidationMessage = '';
      this.selectedPrice = null;
      this.selectedPriceId = null;
      return;
    }

    this.selectedLocationId = clickedLocationId;
    this.selectedFieldId = null;
    this.selectedDate = null;
    this.selectedStartTime = '';
    this.selectedEndTime = '';
    this.selectedSlot = null;
    this.selectedSlotKey = null;
    this.selectedTimeValidationMessage = '';
    this.selectedPrice = null;
    this.selectedPriceId = null;
  }

  selectField(field: any): void {
    const clickedFieldId = field?.id ?? null;

    if (this.selectedFieldId === clickedFieldId) {
      this.selectedFieldId = null;
      this.selectedDate = null;
      this.selectedStartTime = '';
      this.selectedEndTime = '';
      this.selectedSlot = null;
      this.selectedSlotKey = null;
      this.selectedTimeValidationMessage = '';
      this.selectedPrice = null;
      this.selectedPriceId = null;
      this.destroyBookingPickers();
      return;
    }

    this.selectedFieldId = clickedFieldId;
    const price = this.pricesList.find(p => p.fieldId === this.selectedFieldId);
    this.selectedPrice = price?.price ?? null;
    this.selectedPriceId = price?.id ?? null;
    this.selectedDate = null;
    this.selectedStartTime = '';
    this.selectedEndTime = '';
    this.selectedSlot = null;
    this.selectedSlotKey = null;
    this.selectedTimeValidationMessage = '';
    this.refreshBookingPickersWhenVisible();
  }

  onSelectedDateInput(dateValue: string): void {
    this.selectedDate = this.normalizeDateStr(dateValue);
    this.selectedStartTime = '';
    this.selectedEndTime = '';
    this.selectedSlot = null;
    this.selectedSlotKey = null;
    this.selectedTimeValidationMessage = '';
  }

  onSelectedStartTimeInput(timeValue: string): void {
    this.selectedStartTime = String(timeValue ?? '').trim();
    this.validateManualTimeSelection();
  }

  onSelectedEndTimeInput(timeValue: string): void {
    this.selectedEndTime = String(timeValue ?? '').trim();
    this.validateManualTimeSelection();
  }

  private validateManualTimeSelection(): void {
    this.selectedSlot = null;
    this.selectedSlotKey = null;
    this.selectedTimeValidationMessage = '';

    if (!this.selectedFieldId || !this.selectedDate || !this.selectedStartTime || !this.selectedEndTime) {
      return;
    }

    if (this.selectedDate < this.todayDate) {
      this.selectedTimeValidationMessage = 'Csak mai vagy jövőbeli dátum választható.';
      return;
    }

    const startMinutes = this.parseTimeToMinutes(this.selectedStartTime);
    const endMinutes = this.parseTimeToMinutes(this.selectedEndTime);
    if (startMinutes === null || endMinutes === null) {
      this.selectedTimeValidationMessage = 'Érvénytelen időformátum.';
      return;
    }

    if (startMinutes % this.bookingStepMinutes !== 0 || endMinutes % this.bookingStepMinutes !== 0) {
      this.selectedTimeValidationMessage = 'A kezdés és befejezés csak 15 perces lépésekben adható meg.';
      return;
    }

    if (endMinutes <= startMinutes) {
      this.selectedTimeValidationMessage = 'A befejezés idejének később kell lennie, mint a kezdés.';
      return;
    }

    const windows = this.getActiveWindowsForFieldAndDate(this.selectedFieldId, this.selectedDate);
    if (windows.length === 0) {
      this.selectedTimeValidationMessage = 'A kiválasztott pályához ezen a napon nincs aktív nyitvatartás.';
      return;
    }

    const insideWindow = windows.some((windowData: any) => {
      const openMinutes = this.parseTimeToMinutes(windowData?.openTime);
      const closeMinutes = this.parseTimeToMinutes(windowData?.closeTime);
      return openMinutes !== null && closeMinutes !== null && startMinutes >= openMinutes && endMinutes <= closeMinutes;
    });

    if (!insideWindow) {
      this.selectedTimeValidationMessage = 'A megadott időintervallum kívül esik a nyitvatartáson.';
      return;
    }

    if (this.isTimeRangeBooked(this.selectedFieldId, this.selectedDate, startMinutes, endMinutes)) {
      this.selectedTimeValidationMessage = 'A megadott időintervallum már foglalt.';
      return;
    }

    this.selectedSlot = {
      slotKey: `${this.selectedDate}_${startMinutes}_${endMinutes}`,
      date: this.selectedDate,
      startTime: this.minutesToTime(startMinutes),
      endTime: this.minutesToTime(endMinutes)
    };
    this.selectedSlotKey = this.selectedSlot.slotKey;
  }

  selectDate(dateStr: string): void {
    const clickedDate = this.normalizeDateStr(dateStr);

    if (this.selectedDate === clickedDate) {
      this.selectedDate = null;
      this.selectedSlot = null;
      this.selectedSlotKey = null;
      return;
    }

    this.selectedDate = clickedDate;
    this.selectedSlot = null;
    this.selectedSlotKey = null;
  }

  selectSlot(time: any): void {
    const clickedKey = String(time?.slotKey ?? '');
    const selectedKey = String(this.selectedSlot?.slotKey ?? '');

    if (clickedKey && selectedKey && clickedKey === selectedKey) {
      this.selectedSlot = null;
      this.selectedSlotKey = null;
      return;
    }

    this.selectedSlot = time;
    this.selectedSlotKey = clickedKey || null;
  }

  selectAvailableSlot(slot: any): void {
    const clickedKey = String(slot?.slotKey ?? '');
    const selectedKey = String(this.selectedSlot?.slotKey ?? '');

    if (clickedKey && selectedKey && clickedKey === selectedKey) {
      this.selectedStartTime = '';
      this.selectedEndTime = '';
      this.selectedSlot = null;
      this.selectedSlotKey = null;
      this.selectedTimeValidationMessage = '';
      this.bookingStartTimePickerInstance?.clear();
      this.bookingEndTimePickerInstance?.clear();
      return;
    }

    this.selectedDate = this.normalizeDateStr(String(slot?.date ?? this.selectedDate ?? '')) || this.selectedDate;
    this.selectedStartTime = String(slot?.startTime ?? '').trim();
    this.selectedEndTime = String(slot?.endTime ?? '').trim();
    this.selectedSlot = slot;
    this.selectedSlotKey = clickedKey || null;
    this.selectedTimeValidationMessage = '';

    if (this.selectedDate) {
      this.bookingDatePickerInstance?.setDate(this.selectedDate, false, 'Y-m-d');
    }

    if (this.selectedStartTime) {
      this.bookingStartTimePickerInstance?.setDate(this.selectedStartTime, false, 'H:i');
    }

    if (this.selectedEndTime) {
      this.bookingEndTimePickerInstance?.setDate(this.selectedEndTime, false, 'H:i');
    }
  }

  private normalizeDateStr(d: string): string {
    return (d ?? '').includes('T') ? d.split('T')[0] : d;
  }

  private normalizeImageUrl(value: unknown): string | null {
    const imageUrl = String(value ?? '').trim();
    return imageUrl ? imageUrl : null;
  }

  get filteredLocations(): any[] {
    if (!this.selectedSportId) return [];
    const candidates = this.locList.filter(loc =>
      this.fieldsList.some(f => f.sportId === this.selectedSportId && f.locationId === loc.id)
    );

    if (!this.selectedFilterDate) {
      return candidates;
    }

    return candidates.filter(loc => this.locationHasAvailableSlotOnDate(loc.id, this.selectedFilterDate));
  }

  private locationHasAvailableSlotOnDate(locationId: number, date: string): boolean {
    const day = this.normalizeDateStr(date);
    if (!day) {
      return true;
    }

    const fieldIds = new Set(
      this.fieldsList
        .filter(f => f.sportId === this.selectedSportId && f.locationId === locationId)
        .map(f => f.id)
    );

    return Array.from(fieldIds).some((fieldId) => this.getSlotsForFieldAndDate(Number(fieldId), day).length > 0);
  }

  get filteredFields(): any[] {
    if (!this.selectedSportId || !this.selectedLocationId) return [];
    let candidates = this.fieldsList.filter(f =>
      f.sportId === this.selectedSportId && f.locationId === this.selectedLocationId
    );

    if (!this.selectedFilterDate) {
      return candidates;
    }

    const day = this.normalizeDateStr(this.selectedFilterDate);
    candidates = candidates.filter(field => this.getSlotsForFieldAndDate(Number(field.id), day).length > 0);

    return candidates;
  }

  getLocationCardImage(loc: any): string | null {
    return this.normalizeImageUrl(loc?.imageUrl);
  }

  getSportCardImage(sport: any): string | null {
    return this.normalizeImageUrl(sport?.imageUrl);
  }

  getFieldCardImage(field: any): string | null {
    return this.normalizeImageUrl(field?.imageUrl);
  }

  getCardBackgroundImage(imageUrl: unknown): string {
    const gradient = 'linear-gradient(180deg, rgba(8, 16, 30, 0.18) 15%, rgba(8, 16, 30, 0.82) 100%)';
    const normalizedImageUrl = this.normalizeImageUrl(imageUrl);
    return normalizedImageUrl ? `${gradient}, url('${normalizedImageUrl}')` : gradient;
  }

  getFieldCardBackgroundImage(field: any): string {
    const fieldImage = this.getFieldCardImage(field);
    return this.getCardBackgroundImage(fieldImage);
  }

  get availableDates(): string[] {
    if (!this.selectedFieldId) return [];
    const dates = this.getCandidateDates();
    return dates.filter((day) => this.getSlotsForFieldAndDate(this.selectedFieldId!, day).length > 0).sort();
  }

  get timesForSelectedDate(): any[] {
    if (!this.selectedFieldId || !this.selectedDate) return [];
    return this.getSlotsForFieldAndDate(this.selectedFieldId, this.selectedDate);
  }

  get weeklyBookingWindowsForSelectedField(): any[] {
    if (!this.selectedFieldId || !this.fieldBookingWindowsList) {
      return [];
    }

    return this.fieldBookingWindowsList
      .filter((windowData: any) => Number(windowData?.fieldId) === Number(this.selectedFieldId) && Number(windowData?.isActive) === 1)
      .sort((left: any, right: any) => {
        const weekdayDiff = this.getWeekdaySortOrder(Number(left?.weekday)) - this.getWeekdaySortOrder(Number(right?.weekday));
        if (weekdayDiff !== 0) {
          return weekdayDiff;
        }

        return String(left?.openTime ?? '').localeCompare(String(right?.openTime ?? ''));
      })
      .map((windowData: any) => ({
        ...windowData,
        weekdayLabel: this.getWeekdayLabel(Number(windowData?.weekday))
      }));
  }

  get selectedDateBookingWindows(): any[] {
    if (!this.selectedFieldId || !this.selectedDate) {
      return [];
    }

    return this.getActiveWindowsForFieldAndDate(this.selectedFieldId, this.selectedDate)
      .sort((left: any, right: any) => String(left?.openTime ?? '').localeCompare(String(right?.openTime ?? '')));
  }

  get selectedDateReservedBookings(): any[] {
    if (!this.selectedFieldId || !this.selectedDate || !this.bookingsList) {
      return [];
    }

    const day = this.normalizeDateStr(this.selectedDate);

    return this.bookingsList
      .filter((booking: any) =>
        Number(booking?.fieldId) === Number(this.selectedFieldId)
        && this.normalizeDateStr(String(booking?.date ?? '')) === day
      )
      .map((booking: any) => {
        const startMinutes = this.parseTimeToMinutes(booking?.startTime);
        const computedEndMinutes = startMinutes === null ? null : (startMinutes + this.bookingDurationMinutes);
        const endTime = String(booking?.endTime ?? '').trim() || (computedEndMinutes === null ? '' : this.minutesToTime(computedEndMinutes));

        return {
          startTime: String(booking?.startTime ?? '').trim(),
          endTime
        };
      })
      .filter((booking: any) => booking.startTime && booking.endTime)
      .sort((left: any, right: any) => String(left.startTime).localeCompare(String(right.startTime)));
  }

  get pricesForSelectedField(): any[] {
    if (!this.selectedFieldId) return [];
    return this.pricesList.filter(p => p.fieldId === this.selectedFieldId);
  }

  private parseTimeToMinutes(timeValue: unknown): number | null {
    const text = String(timeValue ?? '').trim();
    const parts = text.split(':');
    if (parts.length < 2) {
      return null;
    }

    const hour = Number(parts[0]);
    const minute = Number(parts[1]);
    if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
      return null;
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    return (hour * 60) + minute;
  }

  private minutesToTime(value: number): string {
    const hour = Math.floor(value / 60);
    const minute = value % 60;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  private getWeekdayFromDate(dateValue: string): number | null {
    const parsed = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.getDay();
  }

  private getWeekdayLabel(weekday: number): string {
    return this.weekdayLabels[weekday] ?? 'Ismeretlen nap';
  }

  private getWeekdaySortOrder(weekday: number): number {
    return weekday === 0 ? 7 : weekday;
  }

  private getActiveWindowsForFieldAndDate(fieldId: number, date: string): any[] {
    const weekday = this.getWeekdayFromDate(date);
    if (weekday === null || !this.fieldBookingWindowsList) {
      return [];
    }

    return this.fieldBookingWindowsList.filter((windowData: any) =>
      Number(windowData?.fieldId) === Number(fieldId)
      && Number(windowData?.weekday) === Number(weekday)
      && Number(windowData?.isActive) === 1
    );
  }

  private getCandidateDates(): string[] {
    if (this.selectedFilterDate) {
      return [this.normalizeDateStr(this.selectedFilterDate)];
    }

    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < 21; i += 1) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      dates.push(day.toISOString().split('T')[0]);
    }
    return dates;
  }

  private isTimeRangeBooked(fieldId: number, date: string, startMinutes: number, endMinutes: number): boolean {
    if (!this.bookingsList) {
      return false;
    }

    return this.bookingsList.some((booking: any) => {
      if (Number(booking?.fieldId) !== Number(fieldId)) {
        return false;
      }

      if (this.normalizeDateStr(String(booking?.date ?? '')) !== date) {
        return false;
      }

      const bookedStart = this.parseTimeToMinutes(booking?.startTime);
      if (bookedStart === null) {
        return false;
      }

      const bookedEnd = this.parseTimeToMinutes(booking?.endTime) ?? (bookedStart + this.bookingDurationMinutes);
      return startMinutes < bookedEnd && endMinutes > bookedStart;
    });
  }

  private getSlotsForFieldAndDate(fieldId: number, date: string): any[] {
    const windows = this.getActiveWindowsForFieldAndDate(fieldId, date);

    const slots: any[] = [];
    windows.forEach((windowData: any) => {
      const openMinutes = this.parseTimeToMinutes(windowData?.openTime);
      const closeMinutes = this.parseTimeToMinutes(windowData?.closeTime);
      if (openMinutes === null || closeMinutes === null) {
        return;
      }

      for (let start = openMinutes; start + this.bookingDurationMinutes <= closeMinutes; start += this.bookingStepMinutes) {
        const end = start + this.bookingDurationMinutes;
        if (this.isTimeRangeBooked(fieldId, date, start, end)) {
          continue;
        }

        slots.push({
          slotKey: `${date}_${start}`,
          date,
          startTime: this.minutesToTime(start),
          endTime: this.minutesToTime(end)
        });
      }
    });

    return slots.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  }

  goToBooking(): void {
    if (!this.userId) {
      this.router.navigate(['/login']);
      Swal.fire("Foglaláshoz be kell jelentkezned! Kérjük, jelentkezz be vagy regisztrálj.");
      return;
    }

    if (!this.selectedSlot) {
      Swal.fire({
        title: 'Hiányos időpont',
        text: 'Válassz érvényes dátumot, kezdési és befejezési időt.',
        icon: 'warning'
      });
      return;
    }
    
    this.bookingService.setBookingData({
      sportId: this.selectedSportId,
      locationId: this.selectedLocationId,
      fieldId: this.selectedFieldId,
      userId: this.userId,
      priceId: this.selectedPriceId,
      date: this.selectedSlot?.date ?? this.selectedDate,
      startTime: this.selectedSlot?.startTime,
      endTime: this.selectedSlot?.endTime
    });
    this.router.navigate(['/booking']);
  }

  getBookingButtonHint(): string {
    if (this.selectedSlot) {
      return '';
    }

    if (this.selectedTimeValidationMessage) {
      return this.selectedTimeValidationMessage;
    }

    if (!this.selectedFieldId) {
      return 'Válassz sportot, helyszínt és pályát a foglaláshoz.';
    }

    if (!this.selectedDate) {
      return 'Válassz dátumot.';
    }

    if (!this.selectedStartTime || !this.selectedEndTime) {
      return 'Válassz kezdést és befejezést, majd nyomd meg a ✓ gombot az időpont megerősítéséhez.';
    }

    return 'Válassz érvényes időpontot a továbblépéshez.';
  }

  private showWelcomePopupIfNeeded(): void {
    try {
      if (sessionStorage.getItem(this.welcomeSessionKey) === '1') {
        return;
      }

      sessionStorage.setItem(this.welcomeSessionKey, '1');
    } catch {
      // If sessionStorage is unavailable, still show once for the current render.
    }

    setTimeout(() => {
      void Swal.fire({
        title: 'Üdvözlünk a Budapest Sporttelepek oldalán!',
        html: `
          <div style="display:grid; gap:0.5rem; text-align:center;">
            <p style="margin:0; font-size:0.95rem; color:#3f4d63;">
             Ezen az oldalon egy helyen találhatod Budapest és környékének összes elérhető pályáját, legyen szó bármilyen sportágról. </p>
              <p style="margin:0; font-size:0.95rem; color:#3f4d63;">
             Válassz sportágat, helyszínt, pályát és időpontot néhány kattintással.
            </p>
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-top:0.15rem; text-align:center; justify-content:center;">
              <span style="background:#e8fff1; color:#0f8c41; border:1px solid #b9efcf; border-radius:999px; padding:0.22rem 0.55rem; font-size:0.76rem; font-weight:700;">Gyors foglalás</span>
              <span style="background:#eef7ff; color:#2b5c8e; border:1px solid #c8ddf3; border-radius:999px; padding:0.22rem 0.55rem; font-size:0.76rem; font-weight:700;">Valós elérhetőség</span>
              <span style="background:#fff6e8; color:#9a6421; border:1px solid #f0d9b0; border-radius:999px; padding:0.22rem 0.55rem; font-size:0.76rem; font-weight:700;">Azonnali visszaigazolás</span>
            </div>
          </div>
        `,
        confirmButtonText: 'Kezdjük',
        confirmButtonColor: '#0fca4a',
        background: '#ffffff',
        showClass: {
          popup: 'animate__animated animate__fadeInDown'
        }
      });
    }, 220);
  }
}

