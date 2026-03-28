import { Component, ElementRef, HostListener, inject, OnDestroy, ViewChild } from '@angular/core';
import { AdminService } from '../shared/admin.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../shared/auth.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { SportService } from '../shared/sport.service';
import { LocService } from '../shared/loc.service';
import { FieldService } from '../shared/field.service';
import { CommonModule } from '@angular/common';
import { FieldBookingWindowService } from '../shared/fieldbookingwindow.service';
import { PriceService } from '../shared/price.service';
import { BookingService } from '../shared/booking.service';
import Swal from 'sweetalert2';
import flatpickr from 'flatpickr';
import { Hungarian } from 'flatpickr/dist/l10n/hu.js';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnDestroy {
  protected readonly api = inject(AdminService);
  protected readonly builder = inject(FormBuilder)
  protected readonly auth: AuthService = inject(AuthService)
  protected readonly http = inject(HttpClient);
  protected readonly router = inject(Router);
  protected readonly sportService = inject(SportService);
  protected readonly locService = inject(LocService);
  protected readonly fieldService = inject(FieldService);
  protected readonly fieldBookingWindowService = inject(FieldBookingWindowService);
  protected readonly priceService = inject(PriceService);
  protected readonly bookingService = inject(BookingService);

  private bookingDatePickerInstance: any = null;
  private bookingStartTimePickerInstance: any = null;
  private bookingEndTimePickerInstance: any = null;
  private windowOpenTimePickerInstance: any = null;
  private windowCloseTimePickerInstance: any = null;

  @ViewChild('bookingDatePicker')
  bookingDatePicker?: ElementRef<HTMLInputElement>;

  @ViewChild('bookingStartTimePicker')
  bookingStartTimePicker?: ElementRef<HTMLInputElement>;

  @ViewChild('bookingEndTimePicker')
  bookingEndTimePicker?: ElementRef<HTMLInputElement>;

  @ViewChild('windowOpenTimePicker')
  windowOpenTimePicker?: ElementRef<HTMLInputElement>;

  @ViewChild('windowCloseTimePicker')
  windowCloseTimePicker?: ElementRef<HTMLInputElement>;

  host = 'http://localhost:8000/api/'

  protected users: any
  protected sports: any
  protected locations: any
  protected fields: any
  protected fieldBookingWindows: any
  protected prices: any
  protected bookings: any
  protected showModal = false;
  protected showDeleteModal = false;
  protected editingUserPassword: string | null = null;
  protected editingUserVerified: boolean = false;
  protected editingUserActive: number = 1;
  protected userActiveFilter: 'all' | 'active' | 'inactive' = 'all';

  get filteredUsers(): any[] {
    if (!this.users) return [];
    if (this.userActiveFilter === 'active') return (this.users as any[]).filter((u: any) => Number(u.active) === 1);
    if (this.userActiveFilter === 'inactive') return (this.users as any[]).filter((u: any) => Number(u.active) !== 1);
    return this.users;
  }

  toggleUserActiveFilter(): void {
    if (this.userActiveFilter === 'all') this.userActiveFilter = 'active';
    else if (this.userActiveFilter === 'active') this.userActiveFilter = 'inactive';
    else this.userActiveFilter = 'all';
  }
  protected deletingUserId: number | null = null;
  protected deletingUser: any = null;
  protected editingUserId: number | null = null;
  protected editingSportId: number | null = null;
  protected editingLocationId: number | null = null;
  protected editingFieldId: number | null = null;
  protected editingFieldBookingWindowId: number | null = null;
  protected editingPriceId: number | null = null;
  protected editingBookingId: number | null = null;
  protected openBookingDropdown: 'sport' | 'location' | 'field' | 'user' | 'price' | null = null;
  protected openAdminDropdown: 'fieldLocation' | 'fieldSport' | 'windowWeekday' | 'windowField' | 'windowActive' | 'priceField' | null = null;
  protected activeView: 'users' | 'sports' | 'locations' | 'fields' | 'fieldBookingWindows' | 'prices' | 'bookings' = 'users';

  protected userForm = this.builder.group({
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    fullname: '',
    roleId: ''
  })

  protected sportForm = this.builder.group({
    name: '',
    duration: '',
  })

  protected locationForm = this.builder.group({
    name: '',
    address: '',
    email: ''
  })

  protected fieldForm = this.builder.group({
    name: '',
    locationId: '',
    sportId: '',
  })

  protected fieldBookingWindowForm = this.builder.group({
    weekday: '',
    openTime: '',
    closeTime: '',
    fieldId: '',
    isActive: 1
  })

  protected priceForm = this.builder.group({
    price: '',
    fieldId: '',
  })

  protected bookingForm = this.builder.group({
    sportId: '',
    locationId: '',
    fieldId: '',
    userId: '',
    date: '',
    startTime: '',
    endTime: '',
    priceId: '',
  })

  protected deleteForm = this.builder.group({
    password: '',
    password_confirmation: ''
  })


  ngOnInit() {
    this.getUsers();
    this.getSports();
    this.getLocations();
    this.getFields();
    this.getFieldBookingWindows();
    this.getPrices();
    this.getBookings();
  }

  ngOnDestroy(): void {
    this.destroyModalPickers();
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.fp-select-shell')) {
      this.openBookingDropdown = null;
      this.openAdminDropdown = null;
    }
  }

  @HostListener('window:resize')
  handleWindowResize(): void {
    this.closeBookingDropdown();
    this.closeAdminDropdown();
  }

  toggleBookingDropdown(dropdown: 'sport' | 'location' | 'field' | 'user' | 'price', event: Event): void {
    event.stopPropagation();
    this.openBookingDropdown = this.openBookingDropdown === dropdown ? null : dropdown;
  }

  closeBookingDropdown(): void {
    this.openBookingDropdown = null;
  }

  toggleAdminDropdown(
    dropdown: 'fieldLocation' | 'fieldSport' | 'windowWeekday' | 'windowField' | 'windowActive' | 'priceField',
    event: Event
  ): void {
    event.stopPropagation();
    this.openAdminDropdown = this.openAdminDropdown === dropdown ? null : dropdown;
  }

  closeAdminDropdown(): void {
    this.openAdminDropdown = null;
  }

  selectFieldFormLocation(locationId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.fieldForm.patchValue({ locationId: locationId === null ? '' : String(locationId ?? '') });
    this.closeAdminDropdown();
  }

  selectFieldFormSport(sportId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.fieldForm.patchValue({ sportId: sportId === null ? '' : String(sportId ?? '') });
    this.closeAdminDropdown();
  }

  selectWindowWeekday(weekday: unknown, event?: Event): void {
    event?.stopPropagation();
    this.fieldBookingWindowForm.patchValue({ weekday: weekday === null ? '' : String(weekday ?? '') });
    this.closeAdminDropdown();
  }

  selectWindowField(fieldId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.fieldBookingWindowForm.patchValue({ fieldId: fieldId === null ? '' : String(fieldId ?? '') });
    this.closeAdminDropdown();
  }

  selectWindowActive(isActive: unknown, event?: Event): void {
    event?.stopPropagation();
    this.fieldBookingWindowForm.patchValue({ isActive: Number(isActive ?? 1) });
    this.closeAdminDropdown();
  }

  selectPriceField(fieldId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.priceForm.patchValue({ fieldId: fieldId === null ? '' : String(fieldId ?? '') });
    this.closeAdminDropdown();
  }

  getFieldFormLocationLabel(): string {
    const locationId = this.parseId(this.fieldForm.value.locationId);
    if (!locationId || !this.locations) {
      return '-- Válassz helyszínt --';
    }
    const location = (this.locations as any[]).find((item: any) => Number(item?.id) === locationId);
    return location?.name || '-- Válassz helyszínt --';
  }

  getFieldFormSportLabel(): string {
    const sportId = this.parseId(this.fieldForm.value.sportId);
    if (!sportId || !this.sports) {
      return '-- Válassz sportot --';
    }
    const sport = (this.sports as any[]).find((item: any) => Number(item?.id) === sportId);
    return sport?.name || '-- Válassz sportot --';
  }

  getWindowWeekdayLabel(): string {
    const weekday = Number(this.fieldBookingWindowForm.value.weekday);
    if (!Number.isInteger(weekday)) {
      return '-- Válassz napot --';
    }
    return this.getWeekdayName(weekday);
  }

  getWindowFieldLabel(): string {
    const fieldId = this.parseId(this.fieldBookingWindowForm.value.fieldId);
    if (!fieldId || !this.fields) {
      return '-- Válassz pályát --';
    }
    const field = (this.fields as any[]).find((item: any) => Number(item?.id) === fieldId);
    return field?.name || '-- Válassz pályát --';
  }

  getWindowActiveLabelFromForm(): string {
    const isActive = Number(this.fieldBookingWindowForm.value.isActive);
    if (!Number.isInteger(isActive)) {
      return 'Igen';
    }
    return isActive === 1 ? 'Igen' : 'Nem';
  }

  getPriceFieldLabel(): string {
    const fieldId = this.parseId(this.priceForm.value.fieldId);
    if (!fieldId || !this.fields) {
      return '-- Válassz pályát --';
    }
    const field = (this.fields as any[]).find((item: any) => Number(item?.id) === fieldId);
    return field?.name || '-- Válassz pályát --';
  }

  selectBookingSport(sportId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.bookingForm.patchValue({ sportId: sportId === null ? '' : String(sportId ?? '') });
    this.onBookingSportChange();
    this.closeBookingDropdown();
  }

  selectBookingLocation(locationId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.bookingForm.patchValue({ locationId: locationId === null ? '' : String(locationId ?? '') });
    this.onBookingLocationChange();
    this.closeBookingDropdown();
  }

  selectBookingField(fieldId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.bookingForm.patchValue({ fieldId: fieldId === null ? '' : String(fieldId ?? '') });
    this.onBookingFieldChange();
    this.closeBookingDropdown();
  }

  selectBookingUser(userId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.bookingForm.patchValue({ userId: userId === null ? '' : String(userId ?? '') });
    this.closeBookingDropdown();
  }

  selectBookingPrice(priceId: unknown, event?: Event): void {
    event?.stopPropagation();
    this.bookingForm.patchValue({ priceId: priceId === null ? '' : String(priceId ?? '') });
    this.closeBookingDropdown();
  }

  getBookingSportLabel(): string {
    const sportId = this.parseId(this.bookingForm.value.sportId);
    if (!sportId || !this.sports) {
      return '-- Válassz sportot --';
    }
    const sport = (this.sports as any[]).find((item: any) => Number(item?.id) === sportId);
    return sport?.name || '-- Válassz sportot --';
  }

  getBookingLocationLabel(): string {
    const locationId = this.parseId(this.bookingForm.value.locationId);
    if (!locationId || !this.locations) {
      return '-- Válassz helyszínt --';
    }
    const location = (this.locations as any[]).find((item: any) => Number(item?.id) === locationId);
    return location?.name || '-- Válassz helyszínt --';
  }

  getBookingFieldLabel(): string {
    const fieldId = this.parseId(this.bookingForm.value.fieldId);
    if (!fieldId) {
      return '-- Válassz pályát --';
    }
    const field = this.getFilteredFields().find((item: any) => Number(item?.id) === fieldId);
    return field?.name || '-- Válassz pályát --';
  }

  getBookingUserLabel(): string {
    const userId = this.parseId(this.bookingForm.value.userId);
    if (!userId || !this.users) {
      return '-- Válassz felhasználót --';
    }
    const user = (this.users as any[]).find((item: any) => Number(item?.id) === userId);
    return user?.email || '-- Válassz felhasználót --';
  }

  getBookingPriceLabel(): string {
    const priceId = this.parseId(this.bookingForm.value.priceId);
    if (!priceId) {
      return '-- Válassz árat --';
    }
    const price = this.getFilteredPrices().find((item: any) => Number(item?.id) === priceId);
    return price ? `${price.price} Ft` : '-- Válassz árat --';
  }

  private initializeDatePicker(input: HTMLInputElement, defaultDate?: string, onChange?: (value: string) => void): any {
    return flatpickr(input, {
      locale: Hungarian,
      dateFormat: 'Y-m-d',
      disableMobile: true,
      static: true,
      defaultDate: defaultDate || undefined,
      onChange: (_selectedDates, dateStr) => onChange?.(dateStr)
    });
  }

  private initializeTimePicker(input: HTMLInputElement, defaultTime?: string, onConfirm?: (value: string) => void): any {
    const pickerState = {
      confirmed: false,
      initialValue: this.normalizeTimeForInput(defaultTime),
      pendingValue: this.normalizeTimeForInput(defaultTime)
    };

    return flatpickr(input, {
      locale: Hungarian,
      enableTime: true,
      noCalendar: true,
      time_24hr: true,
      dateFormat: 'H:i',
      minuteIncrement: 15,
      disableMobile: true,
      static: true,
      defaultDate: this.normalizeTimeForInput(defaultTime),
      onReady: (_selectedDates, _timeStr, instance) => {
        this.ensureTimePickerConfirmButton(instance, onConfirm, pickerState);
      },
      onOpen: (_selectedDates, _timeStr, instance) => {
        pickerState.confirmed = false;
        pickerState.initialValue = this.normalizeTimeForInput(input.value || defaultTime);
        pickerState.pendingValue = pickerState.initialValue;
        this.ensureTimePickerConfirmButton(instance, onConfirm, pickerState);
      },
      onChange: (_selectedDates, timeStr) => {
        pickerState.pendingValue = this.normalizeTimeForInput(timeStr);
      },
      onValueUpdate: (_selectedDates, timeStr) => {
        pickerState.pendingValue = this.normalizeTimeForInput(timeStr);
      },
      onClose: (_selectedDates, _timeStr, instance) => {
        if (pickerState.confirmed) {
          pickerState.confirmed = false;
          return;
        }

        onConfirm?.(pickerState.initialValue);

        if (pickerState.initialValue) {
          instance.setDate(pickerState.initialValue, false, 'H:i');
        } else {
          instance.clear(false);
          (instance.input as HTMLInputElement).value = '';
        }
      }
    });
  }

  private ensureTimePickerConfirmButton(
    instance: any,
    onConfirm: ((value: string) => void) | undefined,
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
      const liveValue = this.normalizeTimeForInput((instance?.input as HTMLInputElement | undefined)?.value);
      const committedValue = liveValue || pickerState.pendingValue || pickerState.initialValue || '';
      pickerState.pendingValue = committedValue;
      pickerState.initialValue = committedValue;
      pickerState.confirmed = true;
      onConfirm?.(committedValue);
      instance.close();
    });

    timeContainer.appendChild(confirmButton);
  }

  private initializeFieldBookingWindowPickersWhenReady(): void {
    setTimeout(() => {
      const openInput = this.windowOpenTimePicker?.nativeElement;
      const closeInput = this.windowCloseTimePicker?.nativeElement;

      if (openInput) {
        this.windowOpenTimePickerInstance?.destroy();
        this.windowOpenTimePickerInstance = this.initializeTimePicker(
          openInput,
          String(this.fieldBookingWindowForm.value.openTime ?? ''),
          (timeStr) => this.fieldBookingWindowForm.patchValue({ openTime: timeStr })
        );
      }

      if (closeInput) {
        this.windowCloseTimePickerInstance?.destroy();
        this.windowCloseTimePickerInstance = this.initializeTimePicker(
          closeInput,
          String(this.fieldBookingWindowForm.value.closeTime ?? ''),
          (timeStr) => this.fieldBookingWindowForm.patchValue({ closeTime: timeStr })
        );
      }
    });
  }

  private initializeBookingPickersWhenReady(): void {
    setTimeout(() => {
      const dateInput = this.bookingDatePicker?.nativeElement;
      const startInput = this.bookingStartTimePicker?.nativeElement;
      const endInput = this.bookingEndTimePicker?.nativeElement;

      if (dateInput) {
        this.bookingDatePickerInstance?.destroy();
        this.bookingDatePickerInstance = this.initializeDatePicker(
          dateInput,
          String(this.bookingForm.value.date ?? ''),
          (dateStr) => this.bookingForm.patchValue({ date: dateStr })
        );
      }

      if (startInput) {
        this.bookingStartTimePickerInstance?.destroy();
        this.bookingStartTimePickerInstance = this.initializeTimePicker(
          startInput,
          String(this.bookingForm.value.startTime ?? ''),
          (timeStr) => this.bookingForm.patchValue({ startTime: timeStr })
        );
      }

      if (endInput) {
        this.bookingEndTimePickerInstance?.destroy();
        this.bookingEndTimePickerInstance = this.initializeTimePicker(
          endInput,
          String(this.bookingForm.value.endTime ?? ''),
          (timeStr) => this.bookingForm.patchValue({ endTime: timeStr })
        );
      }
    });
  }

  private destroyModalPickers(): void {
    this.bookingDatePickerInstance?.destroy();
    this.bookingDatePickerInstance = null;
    this.bookingStartTimePickerInstance?.destroy();
    this.bookingStartTimePickerInstance = null;
    this.bookingEndTimePickerInstance?.destroy();
    this.bookingEndTimePickerInstance = null;
    this.windowOpenTimePickerInstance?.destroy();
    this.windowOpenTimePickerInstance = null;
    this.windowCloseTimePickerInstance?.destroy();
    this.windowCloseTimePickerInstance = null;
  }

  getUsers() {
    const token = localStorage.getItem('token');
    if (token) {
      try {

        this.api.getUsers().subscribe({
          next: (result: any) => {
            this.users = result.data || result
          },
          error: (err: any) => {
            console.error('Error fetching users:', err);
          }
        })
      } catch (error) {
        console.error('Error decoding token:', error);
        this.users = [];
      }
    } else {
      console.warn('No token found');
      this.users = [];
    }
  }

  getSports() {
    this.sportService.getSport().subscribe({
      next: (result: any) => {
        this.sports = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching sports:', err);
      }
    })
  }

  getLocations() {
    this.locService.getLocation().subscribe({
      next: (result: any) => {
        this.locations = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching locations:', err);
      }
    })
  }

  getFields() {
    this.fieldService.getField().subscribe({
      next: (result: any) => {
        this.fields = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching fields:', err);
      }
    })
  }

  getFieldBookingWindows() {
    this.fieldBookingWindowService.getFieldBookingWindows().subscribe({
      next: (result: any) => {
        this.fieldBookingWindows = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching field booking windows:', err);
      }
    })
  }

  getPrices() {
    this.priceService.getPrices().subscribe({
      next: (result: any) => {
        this.prices = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching prices:', err);
      }
    })
  }

  getBookings() {
    this.bookingService.getBookings().subscribe({
      next: (result: any) => {
        this.bookings = result.data || result;
      },
      error: (err: any) => {
        console.error('Error fetching bookings:', err);
      }
    })
  }

  startShowModal() {
    this.closeAdminDropdown();
    if (this.activeView === 'users') {
      this.editingUserId = null;
      this.editingUserPassword = null;
      this.editingUserVerified = false;
      this.userForm.reset();
    }
    if (this.activeView === 'sports') {
      this.editingSportId = null;
      this.sportForm.reset();
    }
    if (this.activeView === 'locations') {
      this.editingLocationId = null;
      this.locationForm.reset();
    }
    if (this.activeView === 'fields') {
      this.editingFieldId = null;
      this.fieldForm.reset();
    }
    if (this.activeView === 'fieldBookingWindows') {
      this.editingFieldBookingWindowId = null;
      this.fieldBookingWindowForm.reset({ isActive: 1 });
    }
    if (this.activeView === 'prices') {
      this.editingPriceId = null;
      this.priceForm.reset();
    }
    if (this.activeView === 'bookings') {
      this.editingBookingId = null;
      this.bookingForm.reset();
      this.closeBookingDropdown();
    }
    this.showModal = true

    if (this.activeView === 'fieldBookingWindows') {
      this.initializeFieldBookingWindowPickersWhenReady();
    }
    if (this.activeView === 'bookings') {
      this.initializeBookingPickersWhenReady();
    }

  }
  startCloseModal() {
    this.destroyModalPickers();
    this.closeAdminDropdown();
    this.closeBookingDropdown();
    this.showModal = false;
    if (this.activeView === 'users') {
      this.editingUserId = null;
      this.editingUserPassword = null;
      this.editingUserVerified = false;
      this.userForm.reset();
    }
    if (this.activeView === 'sports') {
      this.editingSportId = null;
      this.sportForm.reset();
    }
    if (this.activeView === 'locations') {
      this.editingLocationId = null;
      this.locationForm.reset();
    }
    if (this.activeView === 'fields') {
      this.editingFieldId = null;
      this.fieldForm.reset();
    }
    if (this.activeView === 'fieldBookingWindows') {
      this.editingFieldBookingWindowId = null;
      this.fieldBookingWindowForm.reset({ isActive: 1 });
    }
    if (this.activeView === 'prices') {
      this.editingPriceId = null;
      this.priceForm.reset();
    }
    if (this.activeView === 'bookings') {
      this.editingBookingId = null;
      this.bookingForm.reset();
    }
  }

  startCloseDeleteModal() {
    this.showDeleteModal = false;
    this.deletingUserId = null;
    this.deletingUser = null;
    this.deleteForm.reset();
  }

  setActiveView(view: 'users' | 'sports' | 'locations' | 'fields' | 'fieldBookingWindows' | 'prices' | 'bookings') {
    this.activeView = view;
  }

  private showProcessingAlert(message: string): void {
    void Swal.fire({
      title: 'Folyamatban',
      text: message,
      icon: 'info',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  private async confirmAction(
    title: string,
    icon: 'question' | 'warning' = 'question',
    confirmButtonText: string = 'Mentés'
  ): Promise<boolean> {
    const confirmation = await Swal.fire({
      title,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText: 'Mégsem'
    });

    return confirmation.isConfirmed;
  }

  //Új felhasználó létrehozása vagy módosítása

  private isPhoneValid(phone: string): boolean {
    return /^\+[0-9]{8,15}$/.test(String(phone ?? '').trim());
  }

  private showPhoneValidationError(): void {
    Swal.fire({
      title: 'Érvénytelen telefonszám',
      text: 'A telefonszámnak + jellel kell kezdődnie (pl. +36301234567).',
      icon: 'warning'
    });
  }

  async startSave() {
    // const confirmation = await Swal.fire({
    //   title: 'Biztosan mented a változtatásokat?',
    //   icon: 'question',
    //   showCancelButton: true,
    //   confirmButtonText: 'Mentés',
    //   cancelButtonText: 'Mégsem'
    // });

    // if (!confirmation.isConfirmed) {
    //   return;
    // }

    if (this.editingUserId) {
      const phone = String(this.userForm.value.phone ?? '').trim();
      if (!this.isPhoneValid(phone)) {
        this.showPhoneValidationError();
        return;
      }

      const userData: any = {
        email: this.userForm.value.email,
        phone,
        fullname: this.userForm.value.fullname,
        roleId: Number(this.userForm.value.roleId),
        verified: this.editingUserVerified,
        active: this.editingUserActive
      };

      this.showProcessingAlert('Felhasználó módosítása folyamatban...');
      this.api.updateUser(this.editingUserId, userData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingUserId = null;
          this.editingUserPassword = null;
          this.editingUserVerified = false;
          this.editingUserActive = 1;
          this.userForm.reset();
          this.getUsers();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating user:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      const phone = String(this.userForm.value.phone ?? '').trim();
      if (!this.isPhoneValid(phone)) {
        this.showPhoneValidationError();
        return;
      }

      // Create new user - don't include roleId
      const userData: any = {
        email: this.userForm.value.email,
        password: this.userForm.value.password,
        password_confirmation: this.userForm.value.password_confirmation,
        phone,
        fullname: this.userForm.value.fullname
      };

      this.showProcessingAlert('Felhasználó létrehozása folyamatban...');
      this.api.addUser(userData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.userForm.reset();
          this.getUsers();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving user:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdateUser(user: any) {
    this.editingUserId = user.id;
    this.editingUserVerified = Boolean(user.verified);
    this.editingUserActive = Number(user.active ?? 1);
    this.userForm.patchValue({
      email: user.email,
      password: '',
      password_confirmation: '',
      phone: user.phone,
      fullname: user.fullname,
      roleId: user.roleId
    });
    this.showModal = true;
  }

  async startDeleteUser(user: any) {
    this.deletingUserId = user.id;
    this.deletingUser = user;
    this.deleteForm.reset();
    this.showDeleteModal = true;
  }

  confirmDeleteUser() {
    const password = this.deleteForm.value.password?.trim();
    const passwordConfirmation = this.deleteForm.value.password_confirmation?.trim();
    const adminEmail = this.getLoggedInUserEmail();
    const isCurrentlyActive = Number(this.deletingUser?.active ?? 1) === 1;

    if (!password || !passwordConfirmation) {
      Swal.fire({
        title: 'Add meg a jelszót és a megerősítést!',
        icon: 'error'
      });
      return;
    }

    if (password !== passwordConfirmation) {
      Swal.fire({
        title: 'A két jelszó nem egyezik!',
        icon: 'error'
      });
      return;
    }

    if (!adminEmail || !this.deletingUserId) {
      Swal.fire({
        title: 'Hiányzik hitelesítési adat!',
        icon: 'error'
      });
      return;
    }

    this.auth.login({ email: adminEmail, password }).subscribe({
      next: () => {
        if (isCurrentlyActive) {
          // Inactivate via DELETE endpoint
          this.showProcessingAlert('Felhasználó inaktiválása folyamatban...');
          this.api.deleteUser(this.deletingUserId!).subscribe({
            next: () => {
              this.startCloseDeleteModal();
              this.getUsers();
              Swal.fire({
                title: 'Sikeres inaktiválás!',
                icon: 'success',
                draggable: true
              });
            },
            error: (err: any) => {
              console.error('Error deactivating user:', err);
              Swal.fire({
                title: 'Hiba történt az inaktiválás során!',
                icon: 'error'
              });
            }
          });
        } else {
          // Reactivate via PUT endpoint
          const phone = String(this.deletingUser?.phone ?? '').trim();
          const userData: any = {
            email: this.deletingUser?.email,
            phone,
            fullname: this.deletingUser?.fullname,
            roleId: Number(this.deletingUser?.roleId),
            verified: Boolean(this.deletingUser?.verified),
            active: 1
          };
          this.showProcessingAlert('Felhasználó aktiválása folyamatban...');
          this.api.updateUser(this.deletingUserId!, userData).subscribe({
            next: () => {
              this.startCloseDeleteModal();
              this.getUsers();
              Swal.fire({
                title: 'Sikeres aktiválás!',
                icon: 'success',
                draggable: true
              });
            },
            error: (err: any) => {
              console.error('Error activating user:', err);
              Swal.fire({
                title: 'Hiba történt az aktiválás során!',
                icon: 'error'
              });
            }
          });
        }
      },
      error: () => {
        Swal.fire({
          title: 'Hibás jelszó! A művelet megszakítva.',
          icon: 'error'
        });
      }
    });
  }


  //Új sport létrehozása vagy módosítása vagy törlése

  async startSaveSport() {
    // const confirmed = await this.confirmAction('Biztosan mented a változtatásokat?', 'question', 'Mentés');
    // if (!confirmed) {
    //   return;
    // }

    const sportData = {
      name: this.sportForm.value.name,
      duration: this.sportForm.value.duration,
    };

    if (this.editingSportId) {
      // Update existing sport
      this.showProcessingAlert('Sport módosítása folyamatban...');
      this.sportService.updateSport(this.editingSportId, sportData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingSportId = null;
          this.sportForm.reset();
          this.getSports();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating sport:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      // Create new sport
      this.showProcessingAlert('Sport létrehozása folyamatban...');
      this.sportService.addSport(sportData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.sportForm.reset();
          this.getSports();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving sport:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdateSport(sport: any) {
    this.editingSportId = sport.id;
    this.sportForm.patchValue({
      name: sport.name,
      duration: sport.duration
    });
    this.showModal = true;
  }

  async startDeleteSport(sportId: number) {
    const confirmed = await this.confirmAction('Biztosan törölni szeretnéd ezt a sportágat?', 'warning', 'Törlés');
    if (!confirmed) {
      return;
    }

    this.showProcessingAlert('Sport törlése folyamatban...');
    this.sportService.deleteSport(sportId).subscribe({
      next: (result: any) => {
        this.getSports();
        Swal.fire({
          title: 'Sikeres törlés!',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error',
          draggable: true
        });
        console.error('Error deleting sport:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    });
  }

  // Új helyszín létrehozása vagy módosítása vagy törlése

  async startSaveLocation() {
    // const confirmed = await this.confirmAction('Biztosan mented a változtatásokat?', 'question', 'Mentés');
    // if (!confirmed) {
    //   return;
    // }

    const locationData = {
      name: this.locationForm.value.name,
      address: this.locationForm.value.address,
      email: this.locationForm.value.email
    };

    if (this.editingLocationId) {
      // Update existing location
      this.showProcessingAlert('Helyszín módosítása folyamatban...');
      this.locService.updateLocation(this.editingLocationId, locationData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingLocationId = null;
          this.locationForm.reset();
          this.getLocations();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating location:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      // Create new location
      this.showProcessingAlert('Helyszín létrehozása folyamatban...');
      this.locService.addLocation(locationData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.locationForm.reset();
          this.getLocations();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving location:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdateLocation(location: any) {
    this.editingLocationId = location.id;
    this.locationForm.patchValue({
      name: location.name,
      address: location.address,
      email: location.email
    });
    this.showModal = true;
  }

  async startDeleteLocation(locationId: number) {
    const confirmed = await this.confirmAction('Biztosan törölni szeretnéd ezt a helyszínt?', 'warning', 'Törlés');
    if (!confirmed) {
      return;
    }

    this.showProcessingAlert('Helyszín törlése folyamatban...');
    this.locService.deleteLocation(locationId).subscribe({
      next: (result: any) => {
        this.getLocations();
        Swal.fire({
          title: 'Sikeres törlés!',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error',
          draggable: true
        });
        console.error('Error deleting location:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    });
  }



  //Új pályák létrehozása vagy módosítása vagy törlése

  async startSaveField() {
    // const confirmed = await this.confirmAction('Biztosan mented a változtatásokat?', 'question', 'Mentés');
    // if (!confirmed) {
    //   return;
    // }

    const fieldData = {
      name: this.fieldForm.value.name,
      locationId: this.fieldForm.value.locationId,
      sportId: this.fieldForm.value.sportId
    };

    if (this.editingFieldId) {
      // Update existing field
      this.showProcessingAlert('Pálya módosítása folyamatban...');
      this.fieldService.updateField(this.editingFieldId, fieldData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingFieldId = null;
          this.fieldForm.reset();
          this.getFields();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating field:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      // Create new field
      this.showProcessingAlert('Pálya létrehozása folyamatban...');
      this.fieldService.addField(fieldData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.fieldForm.reset();
          this.getFields();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving field:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdateField(field: any) {
    // Set the editing state
    this.editingFieldId = field.id;
    // Populate the form with the selected field's data
    this.fieldForm.patchValue({
      name: field.name,
      locationId: field.locationId,
      sportId: field.sportId
    });
    // Open the modal
    this.showModal = true;
  }

  async startDeleteField(fieldId: number) {
    const confirmed = await this.confirmAction('Biztosan törölni szeretnéd ezt a pályát?', 'warning', 'Törlés');
    if (!confirmed) {
      return;
    }

    this.showProcessingAlert('Pálya törlése folyamatban...');
    this.fieldService.deleteField(fieldId).subscribe({
      next: (result: any) => {
        this.getFields();
        Swal.fire({
          title: 'Sikeres törlés!',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error',
          draggable: true
        });
        console.error('Error deleting field:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    });
  }



  // Új nyitvatartás létrehozása vagy módosítása vagy törlése
  async startSaveFieldBookingWindow() {
    // const confirmed = await this.confirmAction('Biztosan mented a változtatásokat?', 'question', 'Mentés');
    // if (!confirmed) {
    //   return;
    // }

    const fieldBookingWindowData = {
      weekday: Number(this.fieldBookingWindowForm.value.weekday),
      openTime: this.fieldBookingWindowForm.value.openTime,
      closeTime: this.fieldBookingWindowForm.value.closeTime,
      fieldId: this.fieldBookingWindowForm.value.fieldId,
      isActive: Number(this.fieldBookingWindowForm.value.isActive ?? 1)
    };

    if (this.editingFieldBookingWindowId) {
      this.showProcessingAlert('Nyitvatartás módosítása folyamatban...');
      this.fieldBookingWindowService.updateFieldBookingWindow(this.editingFieldBookingWindowId, fieldBookingWindowData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingFieldBookingWindowId = null;
          this.fieldBookingWindowForm.reset({ isActive: 1 });
          this.getFieldBookingWindows();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating field booking window:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      this.showProcessingAlert('Nyitvatartás létrehozása folyamatban...');
      this.fieldBookingWindowService.addFieldBookingWindow(fieldBookingWindowData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.fieldBookingWindowForm.reset({ isActive: 1 });
          this.getFieldBookingWindows();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving field booking window:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdateFieldBookingWindow(windowData: any) {
    this.editingFieldBookingWindowId = windowData.id;
    this.fieldBookingWindowForm.patchValue({
      weekday: windowData.weekday,
      openTime: this.normalizeTimeForInput(windowData.openTime),
      closeTime: this.normalizeTimeForInput(windowData.closeTime),
      fieldId: windowData.fieldId,
      isActive: Number(windowData.isActive ?? 1)
    });
    this.showModal = true;
    this.initializeFieldBookingWindowPickersWhenReady();
  }

  async startDeleteFieldBookingWindow(fieldBookingWindowId: number) {
    const confirmed = await this.confirmAction('Biztosan törölni szeretnéd ezt a nyitvatartást?', 'warning', 'Törlés');
    if (!confirmed) {
      return;
    }

    this.showProcessingAlert('Nyitvatartás törlése folyamatban...');
    this.fieldBookingWindowService.deleteFieldBookingWindow(fieldBookingWindowId).subscribe({
      next: (result: any) => {
        this.getFieldBookingWindows();
        Swal.fire({
          title: 'Sikeres törlés!',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error',
          draggable: true
        });
        console.error('Error deleting field booking window:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    });
  }

  //Új ár létrehozása vagy módosítása vagy törlése

  async startSavePrice() {
    // const confirmed = await this.confirmAction('Biztosan mented a változtatásokat?', 'question', 'Mentés');
    // if (!confirmed) {
    //   return;
    // }

    const priceData = {
      price: this.priceForm.value.price,
      fieldId: this.priceForm.value.fieldId
    };

    if (this.editingPriceId) {
      // Update existing price
      this.showProcessingAlert('Ár módosítása folyamatban...');
      this.priceService.updatePrice(this.editingPriceId, priceData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingPriceId = null;
          this.priceForm.reset();
          this.getPrices();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating price:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      // Create new price
      this.showProcessingAlert('Ár létrehozása folyamatban...');
      this.priceService.addPrice(priceData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.priceForm.reset();
          this.getPrices();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving price:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdatePrice(price: any) {
    this.editingPriceId = price.id;
    this.priceForm.patchValue({
      price: price.price,
      fieldId: price.fieldId
    });
    this.showModal = true;
  }

  async startDeletePrice(priceId: number) {
    const confirmed = await this.confirmAction('Biztosan törölni szeretnéd ezt az árat?', 'warning', 'Törlés');
    if (!confirmed) {
      return;
    }

    this.showProcessingAlert('Ár törlése folyamatban...');
    this.priceService.deletePrice(priceId).subscribe({
      next: (result: any) => {
        this.getPrices();
        Swal.fire({
          title: 'Sikeres törlés!',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error',
          draggable: true
        });
        console.error('Error deleting price:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    });
  }

  //Új foglalás létrehozása vagy módosítása vagy törlése
  async startSaveBooking() {
    // const confirmed = await this.confirmAction('Biztosan mented a változtatásokat?', 'question', 'Mentés');
    // if (!confirmed) {
    //   return;
    // }

    const bookingData = {
      sportId: this.bookingForm.value.sportId,
      locationId: this.bookingForm.value.locationId,
      fieldId: this.bookingForm.value.fieldId,
      userId: this.bookingForm.value.userId,
      priceId: this.bookingForm.value.priceId,
      date: this.bookingForm.value.date,
      startTime: this.bookingForm.value.startTime,
      endTime: this.bookingForm.value.endTime
    };

    if (this.editingBookingId) {
      // Update existing booking
      this.showProcessingAlert('Foglalás módosítása folyamatban...');
      this.bookingService.updateBooking(this.editingBookingId, bookingData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingBookingId = null;
          this.bookingForm.reset();
          this.getBookings();
          Swal.fire({
            title: 'Sikeres módosítás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a módosítás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error updating booking:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    } else {
      // Create new booking
      this.showProcessingAlert('Foglalás létrehozása folyamatban...');
      this.bookingService.addBooking(bookingData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.bookingForm.reset();
          this.getBookings();
          Swal.fire({
            title: 'Sikeres létrehozás!',
            icon: 'success',
            draggable: true
          });
        },
        error: (err: any) => {
          Swal.fire({
            title: 'Hiba történt a létrehozás során!',
            icon: 'error',
            draggable: true
          });
          console.error('Error saving booking:', err);
          console.error('Status:', err.status);
          console.error('Error message:', err.message);
        }
      });
    }
  }

  startUpdateBooking(booking: any) {
    this.closeBookingDropdown();
    this.editingBookingId = booking.id;
    this.bookingForm.patchValue({
      sportId: booking.sportId,
      locationId: booking.locationId,
      fieldId: booking.fieldId,
      userId: booking.userId,
      priceId: booking.priceId,
      date: booking.date,
      startTime: this.normalizeTimeForInput(booking.startTime),
      endTime: this.normalizeTimeForInput(booking.endTime)
    });
    this.showModal = true;
    this.initializeBookingPickersWhenReady();
  }

  async startDeleteBooking(bookingId: number) {
    const confirmed = await this.confirmAction('Biztosan törölni szeretnéd ezt a foglalást?', 'warning', 'Törlés');
    if (!confirmed) {
      return;
    }

    this.showProcessingAlert('Foglalás törlése folyamatban...');
    this.bookingService.deleteBooking(bookingId).subscribe({
      next: (result: any) => {
        this.getBookings();
        Swal.fire({
          title: 'Sikeres törlés!',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        Swal.fire({
          title: 'Hiba történt a törlés során!',
          icon: 'error',
          draggable: true
        });
        console.error('Error deleting booking:', err);
        console.error('Status:', err.status);
        console.error('Error message:', err.message);
      }
    });
  }


  //Kijelentkezés
  onSubmit(): void {
    this.auth.logout();
    window.dispatchEvent(new Event('authStateChanged'));
    this.router.navigate(['/login']);
  }

  private getLoggedInUserEmail(): string | null {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));

      if (decodedToken?.email) {
        return decodedToken.email;
      }

      const userId = decodedToken?.id;
      if (!userId || !this.users) {
        return null;
      }

      const currentUser = (this.users as any[]).find((u: any) => u.id === userId);
      return currentUser?.email || null;
    } catch (error) {
      return null;
    }
  }

  private parseId(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  protected toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  onBookingSportChange() {
    this.bookingForm.patchValue({
      fieldId: '',
      date: '',
      startTime: '',
      endTime: '',
      priceId: ''
    });
  }

  onBookingLocationChange() {
    this.bookingForm.patchValue({
      fieldId: '',
      date: '',
      startTime: '',
      endTime: '',
      priceId: ''
    });
  }

  onBookingFieldChange() {
    this.bookingForm.patchValue({
      date: '',
      startTime: '',
      endTime: '',
      priceId: ''
    });
  }

  getFilteredFields(): any[] {
    const sportId = this.parseId(this.bookingForm.value.sportId);
    const locationId = this.parseId(this.bookingForm.value.locationId);
    if (!this.fields || !sportId || !locationId) return [];
    return (this.fields as any[]).filter(
      field => field.sportId === sportId && field.locationId === locationId
    );
  }

  getFilteredPrices(): any[] {
    const fieldId = this.parseId(this.bookingForm.value.fieldId);
    if (!this.prices || !fieldId) return [];
    return (this.prices as any[]).filter(price => price.fieldId === fieldId);
  }

  private normalizeTimeForInput(value: string | null | undefined): string {
    const text = String(value ?? '').trim();
    if (!text) {
      return '';
    }
    const parts = text.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : text;
  }

  getWeekdayName(weekday: number): string {
    const names = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
    return names[Number(weekday)] || 'Ismeretlen';
  }

  getWindowActiveLabel(isActive: unknown): string {
    return Number(isActive) === 1 ? 'Igen' : 'Nem';
  }

  // Helper methods for booking display
  getSportName(sportId: number): string {
    if (!this.sports) return 'N/A';
    const sport = (this.sports as any[]).find(s => s.id === sportId);
    return sport?.name || 'N/A';
  }

  getLocationName(locationId: number): string {
    if (!this.locations) return 'N/A';
    const location = (this.locations as any[]).find(l => l.id === locationId);
    return location?.name || 'N/A';
  }

  getFieldName(fieldId: number): string {
    if (!this.fields) return 'N/A';
    const field = (this.fields as any[]).find(f => f.id === fieldId);
    return field?.name || 'N/A';
  }

  getUserName(userId: number): string {
    if (!this.users) return 'N/A';
    const user = (this.users as any[]).find(u => u.id === userId);
    return user?.email || 'N/A';
  }

  getBookingTimeInfo(booking: any): string {
    if (!booking) return 'N/A';
    const date = booking.date || '-';
    const start = this.normalizeTimeForInput(booking.startTime) || '-';
    const end = this.normalizeTimeForInput(booking.endTime) || '-';
    return `${date} ${start} - ${end}`;
  }

  getPriceValue(priceId: number): string {
    if (!this.prices) return 'N/A';
    const price = (this.prices as any[]).find(p => p.id === priceId);
    return price?.price ? `${price.price} Ft` : 'N/A';
  }

  getBookingTotalPriceValue(booking: any): string {
    const total = Number(booking?.totalPrice ?? NaN);
    if (Number.isFinite(total)) {
      return `${Number(total.toFixed(2))} Ft`;
    }

    const pricePerHour = Number((this.prices as any[] | undefined)?.find((p: any) => p.id === booking?.priceId)?.price ?? NaN);
    if (!Number.isFinite(pricePerHour)) {
      return 'N/A';
    }

    const startMinutes = this.parseTimeToMinutes(booking?.startTime);
    const endMinutes = this.parseTimeToMinutes(booking?.endTime);
    const durationMinutes = (startMinutes !== null && endMinutes !== null && endMinutes > startMinutes)
      ? (endMinutes - startMinutes)
      : 60;

    const amount = (pricePerHour * durationMinutes) / 60;
    return `${Number(amount.toFixed(2))} Ft`;
  }

  private parseTimeToMinutes(value: string | null | undefined): number | null {
    const text = String(value ?? '').trim();
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
}
