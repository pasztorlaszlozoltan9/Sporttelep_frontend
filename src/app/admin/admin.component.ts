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
  protected fieldLocationFilterId: string = 'all';
  protected fieldSportFilterId: string = 'all';
  protected fieldBookingWindowFieldFilterId: string = 'all';
  protected fieldBookingWindowLocationFilterId: string = 'all';
  protected fieldBookingWindowSportFilterId: string = 'all';
  protected priceSportFilterId: string = 'all';
  protected priceLocationFilterId: string = 'all';
  protected bookingListLocationFilterId: string = 'all';
  protected bookingListSportFilterId: string = 'all';
  protected bookingListFieldFilterId: string = 'all';

  get filteredUsers(): any[] {
    if (!this.users) return [];
    if (this.userActiveFilter === 'active') return (this.users as any[]).filter((u: any) => Number(u.active) === 1);
    if (this.userActiveFilter === 'inactive') return (this.users as any[]).filter((u: any) => Number(u.active) !== 1);
    return this.users;
  }

  get usersCountAll(): number {
    return (this.users as any[] | null | undefined)?.length ?? 0;
  }

  get usersCountActive(): number {
    if (!this.users) return 0;
    return (this.users as any[]).filter((u: any) => Number(u?.active) === 1).length;
  }

  get usersCountInactive(): number {
    if (!this.users) return 0;
    return (this.users as any[]).filter((u: any) => Number(u?.active) !== 1).length;
  }

  get filteredFieldsList(): any[] {
    if (!this.fields) return [];
    const locationId = this.parseId(this.fieldLocationFilterId);
    const sportId = this.parseId(this.fieldSportFilterId);
    if (!locationId && !sportId) {
      return this.fields;
    }
    return (this.fields as any[]).filter((field: any) => {
      const locationOk = !locationId || Number(field?.locationId) === locationId;
      const sportOk = !sportId || Number(field?.sportId) === sportId;
      return locationOk && sportOk;
    });
  }

  get filteredFieldBookingWindows(): any[] {
    if (!this.fieldBookingWindows) return [];
    const fieldId = this.parseId(this.fieldBookingWindowFieldFilterId);
    const locationId = this.parseId(this.fieldBookingWindowLocationFilterId);
    const sportId = this.parseId(this.fieldBookingWindowSportFilterId);
    if (!fieldId && !locationId && !sportId) {
      return this.fieldBookingWindows;
    }
    return (this.fieldBookingWindows as any[]).filter((windowData: any) => {
      const windowFieldId = Number(windowData?.fieldId);
      const field = (this.fields as any[] | null | undefined)?.find((item: any) => Number(item?.id) === windowFieldId);
      if (!field) return false;

      const fieldOk = !fieldId || windowFieldId === fieldId;
      const locationOk = !locationId || Number(field?.locationId) === locationId;
      const sportOk = !sportId || Number(field?.sportId) === sportId;
      return fieldOk && locationOk && sportOk;
    });
  }

  get filteredPricesList(): any[] {
    if (!this.prices) return [];
    const sportId = this.parseId(this.priceSportFilterId);
    const locationId = this.parseId(this.priceLocationFilterId);

    if (!sportId && !locationId) {
      return this.prices;
    }

    return (this.prices as any[]).filter((price: any) => {
      const field = (this.fields as any[] | null | undefined)?.find((item: any) => Number(item?.id) === Number(price?.fieldId));
      if (!field) return false;

      const sportOk = !sportId || Number(field?.sportId) === sportId;
      const locationOk = !locationId || Number(field?.locationId) === locationId;
      return sportOk && locationOk;
    });
  }

  get filteredBookingsList(): any[] {
    if (!this.bookings) return [];
    const locationId = this.parseId(this.bookingListLocationFilterId);
    const sportId = this.parseId(this.bookingListSportFilterId);
    const fieldId = this.parseId(this.bookingListFieldFilterId);

    if (!locationId && !sportId && !fieldId) {
      return this.bookings;
    }

    return (this.bookings as any[]).filter((booking: any) => {
      const locationOk = !locationId || Number(booking?.locationId) === locationId;
      const sportOk = !sportId || Number(booking?.sportId) === sportId;
      const fieldOk = !fieldId || Number(booking?.fieldId) === fieldId;
      return locationOk && sportOk && fieldOk;
    });
  }

  get hasActiveUsersFilter(): boolean {
    return this.userActiveFilter !== 'all';
  }

  get hasActiveFieldsFilter(): boolean {
    return this.fieldLocationFilterId !== 'all' || this.fieldSportFilterId !== 'all';
  }

  get hasActiveFieldBookingWindowFilter(): boolean {
    return this.fieldBookingWindowLocationFilterId !== 'all'
      || this.fieldBookingWindowSportFilterId !== 'all'
      || this.fieldBookingWindowFieldFilterId !== 'all';
  }

  get hasActivePricesFilter(): boolean {
    return this.priceLocationFilterId !== 'all' || this.priceSportFilterId !== 'all';
  }

  get hasActiveBookingsFilter(): boolean {
    return this.bookingListLocationFilterId !== 'all'
      || this.bookingListSportFilterId !== 'all'
      || this.bookingListFieldFilterId !== 'all';
  }

  clearUsersFilter(): void {
    this.userActiveFilter = 'all';
  }

  clearFieldsFilter(): void {
    this.fieldLocationFilterId = 'all';
    this.fieldSportFilterId = 'all';
  }

  clearFieldBookingWindowFilter(): void {
    this.fieldBookingWindowLocationFilterId = 'all';
    this.fieldBookingWindowSportFilterId = 'all';
    this.fieldBookingWindowFieldFilterId = 'all';
  }

  clearPricesFilter(): void {
    this.priceLocationFilterId = 'all';
    this.priceSportFilterId = 'all';
  }

  clearBookingsFilter(): void {
    this.bookingListLocationFilterId = 'all';
    this.bookingListSportFilterId = 'all';
    this.bookingListFieldFilterId = 'all';
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
  protected openListFilterDropdown:
    | 'userStatus'
    | 'fieldsLocation'
    | 'fieldsSport'
    | 'windowLocation'
    | 'windowSport'
    | 'windowField'
    | 'priceLocation'
    | 'priceSport'
    | 'bookingLocation'
    | 'bookingSport'
    | 'bookingField'
    | null = null;
  protected activeView: 'users' | 'sports' | 'locations' | 'fields' | 'fieldBookingWindows' | 'prices' | 'bookings' = 'users';

  // Image upload state
  protected uploadingSport = false;
  protected uploadingLocation = false;
  protected uploadingField = false;
  protected sportImageUrl: string | null = null;
  protected locationImageUrl: string | null = null;
  protected fieldImageUrl: string | null = null;
  protected cloudinaryImageUrls: string[] = [];
  protected cloudinaryImagesLoaded = false;
  // Tracks a freshly uploaded URL that needs Cloudinary cleanup on cancel
  protected pendingSportImageUrl: string | null = null;
  protected pendingLocationImageUrl: string | null = null;
  protected pendingFieldImageUrl: string | null = null;
  // Stores the image URL that was active before the current upload (for restore on discard)
  protected prevSportImageUrl: string | null = null;
  protected prevLocationImageUrl: string | null = null;
  protected prevFieldImageUrl: string | null = null;
  // Gallery visibility toggles
  protected showSportImageGallery = false;
  protected showLocationImageGallery = false;
  protected showFieldImageGallery = false;

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
    imageUrl: ''
  })

  protected locationForm = this.builder.group({
    name: '',
    address: '',
    email: '',
    imageUrl: ''
  })

  protected fieldForm = this.builder.group({
    name: '',
    locationId: '',
    sportId: '',
    imageUrl: ''
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
    note: '',
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
    this.getCloudinaryImages();
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
      this.openListFilterDropdown = null;
    }
  }

  @HostListener('window:resize')
  handleWindowResize(): void {
    this.closeBookingDropdown();
    this.closeAdminDropdown();
    this.closeListFilterDropdown();
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

  toggleListFilterDropdown(
    dropdown:
      | 'userStatus'
      | 'fieldsLocation'
      | 'fieldsSport'
      | 'windowLocation'
      | 'windowSport'
      | 'windowField'
      | 'priceLocation'
      | 'priceSport'
      | 'bookingLocation'
      | 'bookingSport'
      | 'bookingField',
    event: Event
  ): void {
    event.stopPropagation();
    this.openListFilterDropdown = this.openListFilterDropdown === dropdown ? null : dropdown;
  }

  closeListFilterDropdown(): void {
    this.openListFilterDropdown = null;
  }

  selectUserActiveFilter(value: 'all' | 'active' | 'inactive', event?: Event): void {
    event?.stopPropagation();
    this.userActiveFilter = value;
    this.closeListFilterDropdown();
  }

  selectFieldLocationFilter(value: string, event?: Event): void {
    event?.stopPropagation();
    this.fieldLocationFilterId = value;
    this.resetFieldSportFilterIfInvalid();
    this.closeListFilterDropdown();
  }

  selectFieldSportFilter(value: string, event?: Event): void {
    event?.stopPropagation();
    this.fieldSportFilterId = value;
    this.resetFieldLocationFilterIfInvalid();
    this.closeListFilterDropdown();
  }

  selectFieldBookingWindowLocationFilter(value: string, event?: Event): void {
    event?.stopPropagation();
    this.fieldBookingWindowLocationFilterId = value;
    this.resetFieldBookingWindowSportFilterIfInvalid();
    this.resetFieldBookingWindowFieldFilterIfInvalid();
    this.closeListFilterDropdown();
  }

  selectFieldBookingWindowSportFilter(value: string, event?: Event): void {
    event?.stopPropagation();
    this.fieldBookingWindowSportFilterId = value;
    this.resetFieldBookingWindowLocationFilterIfInvalid();
    this.resetFieldBookingWindowFieldFilterIfInvalid();
    this.closeListFilterDropdown();
  }

  selectFieldBookingWindowFieldFilter(value: string, event?: Event): void {
    event?.stopPropagation();
    this.fieldBookingWindowFieldFilterId = value;
    this.closeListFilterDropdown();
  }

  selectPriceLocationFilter(value: string, event?: Event): void {
    event?.stopPropagation();
    this.priceLocationFilterId = value;
    this.resetPriceSportFilterIfInvalid();
    this.closeListFilterDropdown();
  }

  selectPriceSportFilter(value: string, event?: Event): void {
    event?.stopPropagation();
    this.priceSportFilterId = value;
    this.resetPriceLocationFilterIfInvalid();
    this.closeListFilterDropdown();
  }

  selectBookingListLocationFilter(value: string, event?: Event): void {
    event?.stopPropagation();
    this.bookingListLocationFilterId = value;
    this.resetBookingListSportFilterIfInvalid();
    this.resetBookingListFieldFilterIfInvalid();
    this.closeListFilterDropdown();
  }

  selectBookingListSportFilter(value: string, event?: Event): void {
    event?.stopPropagation();
    this.bookingListSportFilterId = value;
    this.resetBookingListLocationFilterIfInvalid();
    this.resetBookingListFieldFilterIfInvalid();
    this.closeListFilterDropdown();
  }

  private getLocationsForSportFilter(sportFilterId: string): any[] {
    if (!this.locations) return [];

    const sportId = this.parseId(sportFilterId);
    if (!sportId || !this.fields) {
      return this.locations;
    }

    const locationIds = new Set(
      (this.fields as any[])
        .filter((field: any) => Number(field?.sportId) === sportId)
        .map((field: any) => Number(field?.locationId))
        .filter((locationId: number) => Number.isFinite(locationId))
    );

    return (this.locations as any[]).filter((location: any) => locationIds.has(Number(location?.id)));
  }

  getFieldLocationFilterOptions(): any[] {
    return this.getLocationsForSportFilter(this.fieldSportFilterId);
  }

  private getSportsForLocationFilter(locationFilterId: string): any[] {
    if (!this.sports) return [];

    const locationId = this.parseId(locationFilterId);
    if (!locationId || !this.fields) {
      return this.sports;
    }

    const sportIds = new Set(
      (this.fields as any[])
        .filter((field: any) => Number(field?.locationId) === locationId)
        .map((field: any) => Number(field?.sportId))
        .filter((sportId: number) => Number.isFinite(sportId))
    );

    return (this.sports as any[]).filter((sport: any) => sportIds.has(Number(sport?.id)));
  }

  getFieldSportFilterOptions(): any[] {
    return this.getSportsForLocationFilter(this.fieldLocationFilterId);
  }

  getFieldBookingWindowSportFilterOptions(): any[] {
    return this.getSportsForLocationFilter(this.fieldBookingWindowLocationFilterId);
  }

  getFieldBookingWindowLocationFilterOptions(): any[] {
    return this.getLocationsForSportFilter(this.fieldBookingWindowSportFilterId);
  }

  getPriceLocationFilterOptions(): any[] {
    return this.getLocationsForSportFilter(this.priceSportFilterId);
  }

  getPriceSportFilterOptions(): any[] {
    return this.getSportsForLocationFilter(this.priceLocationFilterId);
  }

  getBookingListLocationFilterOptions(): any[] {
    return this.getLocationsForSportFilter(this.bookingListSportFilterId);
  }

  getBookingListSportFilterOptions(): any[] {
    return this.getSportsForLocationFilter(this.bookingListLocationFilterId);
  }

  getFieldBookingWindowFieldOptions(): any[] {
    if (!this.fields) return [];
    const locationId = this.parseId(this.fieldBookingWindowLocationFilterId);
    const sportId = this.parseId(this.fieldBookingWindowSportFilterId);

    return (this.fields as any[]).filter((field: any) => {
      const locationOk = !locationId || Number(field?.locationId) === locationId;
      const sportOk = !sportId || Number(field?.sportId) === sportId;
      return locationOk && sportOk;
    });
  }

  private resetFieldSportFilterIfInvalid(): void {
    const selectedSportId = this.parseId(this.fieldSportFilterId);
    if (!selectedSportId) return;

    const stillVisible = this.getFieldSportFilterOptions().some((sport: any) => Number(sport?.id) === selectedSportId);
    if (!stillVisible) {
      this.fieldSportFilterId = 'all';
    }
  }

  private resetFieldLocationFilterIfInvalid(): void {
    const selectedLocationId = this.parseId(this.fieldLocationFilterId);
    if (!selectedLocationId) return;

    const stillVisible = this.getFieldLocationFilterOptions().some((location: any) => Number(location?.id) === selectedLocationId);
    if (!stillVisible) {
      this.fieldLocationFilterId = 'all';
    }
  }

  private resetFieldBookingWindowSportFilterIfInvalid(): void {
    const selectedSportId = this.parseId(this.fieldBookingWindowSportFilterId);
    if (!selectedSportId) return;

    const stillVisible = this.getFieldBookingWindowSportFilterOptions().some((sport: any) => Number(sport?.id) === selectedSportId);
    if (!stillVisible) {
      this.fieldBookingWindowSportFilterId = 'all';
    }
  }

  private resetFieldBookingWindowLocationFilterIfInvalid(): void {
    const selectedLocationId = this.parseId(this.fieldBookingWindowLocationFilterId);
    if (!selectedLocationId) return;

    const stillVisible = this.getFieldBookingWindowLocationFilterOptions().some((location: any) => Number(location?.id) === selectedLocationId);
    if (!stillVisible) {
      this.fieldBookingWindowLocationFilterId = 'all';
    }
  }

  private resetFieldBookingWindowFieldFilterIfInvalid(): void {
    const selectedFieldId = this.parseId(this.fieldBookingWindowFieldFilterId);
    if (!selectedFieldId) return;

    const stillVisible = this.getFieldBookingWindowFieldOptions().some((field: any) => Number(field?.id) === selectedFieldId);
    if (!stillVisible) {
      this.fieldBookingWindowFieldFilterId = 'all';
    }
  }

  private resetPriceSportFilterIfInvalid(): void {
    const selectedSportId = this.parseId(this.priceSportFilterId);
    if (!selectedSportId) return;

    const stillVisible = this.getPriceSportFilterOptions().some((sport: any) => Number(sport?.id) === selectedSportId);
    if (!stillVisible) {
      this.priceSportFilterId = 'all';
    }
  }

  private resetPriceLocationFilterIfInvalid(): void {
    const selectedLocationId = this.parseId(this.priceLocationFilterId);
    if (!selectedLocationId) return;

    const stillVisible = this.getPriceLocationFilterOptions().some((location: any) => Number(location?.id) === selectedLocationId);
    if (!stillVisible) {
      this.priceLocationFilterId = 'all';
    }
  }

  private resetBookingListSportFilterIfInvalid(): void {
    const selectedSportId = this.parseId(this.bookingListSportFilterId);
    if (!selectedSportId) return;

    const stillVisible = this.getBookingListSportFilterOptions().some((sport: any) => Number(sport?.id) === selectedSportId);
    if (!stillVisible) {
      this.bookingListSportFilterId = 'all';
    }
  }

  private resetBookingListLocationFilterIfInvalid(): void {
    const selectedLocationId = this.parseId(this.bookingListLocationFilterId);
    if (!selectedLocationId) return;

    const stillVisible = this.getBookingListLocationFilterOptions().some((location: any) => Number(location?.id) === selectedLocationId);
    if (!stillVisible) {
      this.bookingListLocationFilterId = 'all';
    }
  }

  selectBookingListFieldFilter(value: string, event?: Event): void {
    event?.stopPropagation();
    this.bookingListFieldFilterId = value;
    this.closeListFilterDropdown();
  }

  private resetBookingListFieldFilterIfInvalid(): void {
    const selectedFieldId = this.parseId(this.bookingListFieldFilterId);
    if (!selectedFieldId) return;
    const stillVisible = this.getBookingListFieldOptions().some((field: any) => Number(field?.id) === selectedFieldId);
    if (!stillVisible) {
      this.bookingListFieldFilterId = 'all';
    }
  }

  getUserActiveFilterLabel(): string {
    if (this.userActiveFilter === 'active') {
      return `Aktív (${this.usersCountActive})`;
    }
    if (this.userActiveFilter === 'inactive') {
      return `Inaktív (${this.usersCountInactive})`;
    }
    return `Minden felhasználó (${this.usersCountAll})`;
  }

  getFieldLocationFilterLabel(): string {
    const locationId = this.parseId(this.fieldLocationFilterId);
    if (!locationId || !this.locations) {
      return 'Minden helyszín';
    }
    const location = (this.locations as any[]).find((item: any) => Number(item?.id) === locationId);
    return location?.name || 'Minden helyszín';
  }

  getFieldSportFilterLabel(): string {
    const sportId = this.parseId(this.fieldSportFilterId);
    if (!sportId || !this.sports) {
      return 'Minden sport';
    }
    const sport = (this.sports as any[]).find((item: any) => Number(item?.id) === sportId);
    return sport?.name || 'Minden sport';
  }

  getFieldBookingWindowLocationFilterLabel(): string {
    const locationId = this.parseId(this.fieldBookingWindowLocationFilterId);
    if (!locationId || !this.locations) {
      return 'Minden helyszín';
    }
    const location = (this.locations as any[]).find((item: any) => Number(item?.id) === locationId);
    return location?.name || 'Minden helyszín';
  }

  getFieldBookingWindowSportFilterLabel(): string {
    const sportId = this.parseId(this.fieldBookingWindowSportFilterId);
    if (!sportId || !this.sports) {
      return 'Minden sport';
    }
    const sport = (this.sports as any[]).find((item: any) => Number(item?.id) === sportId);
    return sport?.name || 'Minden sport';
  }

  getFieldBookingWindowFieldFilterLabel(): string {
    const fieldId = this.parseId(this.fieldBookingWindowFieldFilterId);
    if (!fieldId || !this.fields) {
      return 'Minden pálya';
    }
    const field = (this.fields as any[]).find((item: any) => Number(item?.id) === fieldId);
    return field?.name || 'Minden pálya';
  }

  getPriceLocationFilterLabel(): string {
    const locationId = this.parseId(this.priceLocationFilterId);
    if (!locationId || !this.locations) {
      return 'Minden helyszín';
    }
    const location = (this.locations as any[]).find((item: any) => Number(item?.id) === locationId);
    return location?.name || 'Minden helyszín';
  }

  getPriceSportFilterLabel(): string {
    const sportId = this.parseId(this.priceSportFilterId);
    if (!sportId || !this.sports) {
      return 'Minden sport';
    }
    const sport = (this.sports as any[]).find((item: any) => Number(item?.id) === sportId);
    return sport?.name || 'Minden sport';
  }

  getBookingListLocationFilterLabel(): string {
    const locationId = this.parseId(this.bookingListLocationFilterId);
    if (!locationId || !this.locations) {
      return 'Minden helyszín';
    }
    const location = (this.locations as any[]).find((item: any) => Number(item?.id) === locationId);
    return location?.name || 'Minden helyszín';
  }

  getBookingListSportFilterLabel(): string {
    const sportId = this.parseId(this.bookingListSportFilterId);
    if (!sportId || !this.sports) {
      return 'Minden sport';
    }
    const sport = (this.sports as any[]).find((item: any) => Number(item?.id) === sportId);
    return sport?.name || 'Minden sport';
  }

  getBookingListFieldFilterLabel(): string {
    const fieldId = this.parseId(this.bookingListFieldFilterId);
    if (!fieldId || !this.fields) {
      return 'Minden pálya';
    }
    const field = (this.fields as any[]).find((item: any) => Number(item?.id) === fieldId);
    return field?.name || 'Minden pálya';
  }

  getBookingListFieldOptions(): any[] {
    if (!this.fields) return [];
    const locationId = this.parseId(this.bookingListLocationFilterId);
    const sportId = this.parseId(this.bookingListSportFilterId);
    return (this.fields as any[]).filter((field: any) => {
      const locationOk = !locationId || Number(field?.locationId) === locationId;
      const sportOk = !sportId || Number(field?.sportId) === sportId;
      return locationOk && sportOk;
    });
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

  // Image upload method
  uploadImage(file: File, type: 'sport' | 'location' | 'field'): void {
    if (!file) {
      Swal.fire({
        title: 'Hiba!',
        text: 'Válassz ki egy fájlt!',
        icon: 'error',
        draggable: true
      });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      Swal.fire({
        title: 'Hiba!',
        text: 'Nincs aktív bejelentkezés. Kérjük, jelentkezz be újra!',
        icon: 'error',
        draggable: true
      });
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    if (type === 'sport') {
      this.uploadingSport = true;
    } else if (type === 'location') {
      this.uploadingLocation = true;
    } else if (type === 'field') {
      this.uploadingField = true;
    }

    const headers = {
      'Authorization': `Bearer ${token}`
    };

    this.http.post(`${this.host}uploads/image`, formData, { headers }).subscribe({
      next: (result: any) => {
        const imageUrl = result.data?.imageUrl || result.imageUrl;
        
        if (type === 'sport') {
          if (this.pendingSportImageUrl) { this.deleteImageFromCloud(this.pendingSportImageUrl); }
          this.prevSportImageUrl = this.sportImageUrl;
          this.pendingSportImageUrl = imageUrl;
          this.sportImageUrl = imageUrl;
          this.sportForm.patchValue({ imageUrl: imageUrl });
          this.uploadingSport = false;
        } else if (type === 'location') {
          if (this.pendingLocationImageUrl) { this.deleteImageFromCloud(this.pendingLocationImageUrl); }
          this.prevLocationImageUrl = this.locationImageUrl;
          this.pendingLocationImageUrl = imageUrl;
          this.locationImageUrl = imageUrl;
          this.locationForm.patchValue({ imageUrl: imageUrl });
          this.uploadingLocation = false;
        } else if (type === 'field') {
          if (this.pendingFieldImageUrl) { this.deleteImageFromCloud(this.pendingFieldImageUrl); }
          this.prevFieldImageUrl = this.fieldImageUrl;
          this.pendingFieldImageUrl = imageUrl;
          this.fieldImageUrl = imageUrl;
          this.fieldForm.patchValue({ imageUrl: imageUrl });
          this.uploadingField = false;
        }

        Swal.fire({
          title: 'Sikeres feltöltés!',
          text: 'A kép sikeresen feltöltve.',
          icon: 'success',
          draggable: true
        });
      },
      error: (err: any) => {
        if (type === 'sport') {
          this.uploadingSport = false;
        } else if (type === 'location') {
          this.uploadingLocation = false;
        } else if (type === 'field') {
          this.uploadingField = false;
        }

        Swal.fire({
          title: 'Hiba a feltöltéskor!',
          text: err.error?.message || 'Valamilyen hiba történt a feltöltés során.',
          icon: 'error',
          draggable: true
        });
        console.error('Error uploading image:', err);
      }
    });
  }

  private deleteImageFromCloud(imageUrl: string): void {
    const token = localStorage.getItem('token');
    if (!token || !imageUrl) { return; }
    this.http.delete(`${this.host}uploads/image`, {
      headers: { 'Authorization': `Bearer ${token}` },
      body: { imageUrl }
    }).subscribe({ error: (err: any) => console.error('Could not delete image from cloud:', err) });
  }

  discardUploadedImage(type: 'sport' | 'location' | 'field'): void {
    if (type === 'sport') {
      if (this.pendingSportImageUrl) { this.deleteImageFromCloud(this.pendingSportImageUrl); }
      this.sportImageUrl = this.prevSportImageUrl;
      this.sportForm.patchValue({ imageUrl: this.prevSportImageUrl || '' });
      this.pendingSportImageUrl = null;
      this.prevSportImageUrl = null;
    } else if (type === 'location') {
      if (this.pendingLocationImageUrl) { this.deleteImageFromCloud(this.pendingLocationImageUrl); }
      this.locationImageUrl = this.prevLocationImageUrl;
      this.locationForm.patchValue({ imageUrl: this.prevLocationImageUrl || '' });
      this.pendingLocationImageUrl = null;
      this.prevLocationImageUrl = null;
    } else if (type === 'field') {
      if (this.pendingFieldImageUrl) { this.deleteImageFromCloud(this.pendingFieldImageUrl); }
      this.fieldImageUrl = this.prevFieldImageUrl;
      this.fieldForm.patchValue({ imageUrl: this.prevFieldImageUrl || '' });
      this.pendingFieldImageUrl = null;
      this.prevFieldImageUrl = null;
    }
  }

  selectExistingImage(url: string, type: 'sport' | 'location' | 'field'): void {
    if (type === 'sport') {
      if (this.pendingSportImageUrl) { this.deleteImageFromCloud(this.pendingSportImageUrl); this.pendingSportImageUrl = null; this.prevSportImageUrl = null; }
      const next = this.sportImageUrl === url ? null : url;
      this.sportImageUrl = next;
      this.sportForm.patchValue({ imageUrl: next || '' });
      if (next) { this.showSportImageGallery = false; }
    } else if (type === 'location') {
      if (this.pendingLocationImageUrl) { this.deleteImageFromCloud(this.pendingLocationImageUrl); this.pendingLocationImageUrl = null; this.prevLocationImageUrl = null; }
      const next = this.locationImageUrl === url ? null : url;
      this.locationImageUrl = next;
      this.locationForm.patchValue({ imageUrl: next || '' });
      if (next) { this.showLocationImageGallery = false; }
    } else if (type === 'field') {
      if (this.pendingFieldImageUrl) { this.deleteImageFromCloud(this.pendingFieldImageUrl); this.pendingFieldImageUrl = null; this.prevFieldImageUrl = null; }
      const next = this.fieldImageUrl === url ? null : url;
      this.fieldImageUrl = next;
      this.fieldForm.patchValue({ imageUrl: next || '' });
      if (next) { this.showFieldImageGallery = false; }
    }
  }

  toggleImageGallery(type: 'sport' | 'location' | 'field'): void {
    if (type === 'sport') { this.showSportImageGallery = !this.showSportImageGallery; }
    else if (type === 'location') { this.showLocationImageGallery = !this.showLocationImageGallery; }
    else if (type === 'field') { this.showFieldImageGallery = !this.showFieldImageGallery; }
  }

  get existingSportImages(): string[] {
    if (this.cloudinaryImagesLoaded) {
      return this.cloudinaryImageUrls;
    }
    return [...new Set((this.sports as any[] ?? []).map((s: any) => s?.imageUrl).filter((u: any): u is string => !!u))];
  }

  get existingLocationImages(): string[] {
    if (this.cloudinaryImagesLoaded) {
      return this.cloudinaryImageUrls;
    }
    return [...new Set((this.locations as any[] ?? []).map((l: any) => l?.imageUrl).filter((u: any): u is string => !!u))];
  }

  get existingFieldImages(): string[] {
    if (this.cloudinaryImagesLoaded) {
      return this.cloudinaryImageUrls;
    }
    return [...new Set((this.fields as any[] ?? []).map((f: any) => f?.imageUrl).filter((u: any): u is string => !!u))];
  }

  private extractImageUrlsFromPayload(payload: any): string[] {
    const urls = new Set<string>();
    const queue: any[] = [payload];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        continue;
      }

      if (Array.isArray(current)) {
        for (const item of current) {
          queue.push(item);
        }
        continue;
      }

      if (typeof current === 'string') {
        const value = current.trim();
        if (value.startsWith('http://') || value.startsWith('https://')) {
          urls.add(value);
        }
        continue;
      }

      if (typeof current !== 'object') {
        continue;
      }

      const directUrl = String(current.url ?? current.secure_url ?? current.imageUrl ?? '').trim();
      if (directUrl) {
        urls.add(directUrl);
      }

      for (const nested of Object.values(current)) {
        if (nested) {
          queue.push(nested);
        }
      }
    }

    return [...urls];
  }

  getCloudinaryImages() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.cloudinaryImagesLoaded = true;
      this.cloudinaryImageUrls = [];
      return;
    }

    this.http.get(`${this.host}uploads/images`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).subscribe({
      next: (result: any) => {
        const urls = this.extractImageUrlsFromPayload(result);
        this.cloudinaryImagesLoaded = true;
        this.cloudinaryImageUrls = [...new Set(urls)];
      },
      error: (err: any) => {
        console.error('Error fetching Cloudinary images:', err);
        this.cloudinaryImagesLoaded = true;
        this.cloudinaryImageUrls = [];
      }
    });
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
      this.sportImageUrl = null;
      this.pendingSportImageUrl = null;
      this.prevSportImageUrl = null;
      this.showSportImageGallery = false;
    }
    if (this.activeView === 'locations') {
      this.editingLocationId = null;
      this.locationForm.reset();
      this.locationImageUrl = null;
      this.pendingLocationImageUrl = null;
      this.prevLocationImageUrl = null;
      this.showLocationImageGallery = false;
    }
    if (this.activeView === 'fields') {
      this.editingFieldId = null;
      this.fieldForm.reset();
      this.fieldImageUrl = null;
      this.pendingFieldImageUrl = null;
      this.prevFieldImageUrl = null;
      this.showFieldImageGallery = false;
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
      if (this.pendingSportImageUrl) { this.deleteImageFromCloud(this.pendingSportImageUrl); }
      this.pendingSportImageUrl = null;
      this.prevSportImageUrl = null;
      this.showSportImageGallery = false;
      this.editingSportId = null;
      this.sportForm.reset();
      this.sportImageUrl = null;
    }
    if (this.activeView === 'locations') {
      if (this.pendingLocationImageUrl) { this.deleteImageFromCloud(this.pendingLocationImageUrl); }
      this.pendingLocationImageUrl = null;
      this.prevLocationImageUrl = null;
      this.showLocationImageGallery = false;
      this.editingLocationId = null;
      this.locationForm.reset();
      this.locationImageUrl = null;
    }
    if (this.activeView === 'fields') {
      if (this.pendingFieldImageUrl) { this.deleteImageFromCloud(this.pendingFieldImageUrl); }
      this.pendingFieldImageUrl = null;
      this.prevFieldImageUrl = null;
      this.showFieldImageGallery = false;
      this.editingFieldId = null;
      this.fieldForm.reset();
      this.fieldImageUrl = null;
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
      imageUrl: this.sportForm.value.imageUrl || ''
    };

    if (this.editingSportId) {
      // Update existing sport
      this.showProcessingAlert('Sport módosítása folyamatban...');
      this.sportService.updateSport(this.editingSportId, sportData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingSportId = null;
          this.sportForm.reset();
          this.sportImageUrl = null;
          this.pendingSportImageUrl = null;
          this.prevSportImageUrl = null;
          this.showSportImageGallery = false;
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
          this.sportImageUrl = null;
          this.pendingSportImageUrl = null;
          this.prevSportImageUrl = null;
          this.showSportImageGallery = false;
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
    this.sportImageUrl = sport.imageUrl || null;
    this.pendingSportImageUrl = null;
    this.prevSportImageUrl = null;
    this.showSportImageGallery = false;
    this.sportForm.patchValue({
      name: sport.name,
      imageUrl: sport.imageUrl || ''
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
      email: this.locationForm.value.email,
      imageUrl: this.locationForm.value.imageUrl || ''
    };

    if (this.editingLocationId) {
      // Update existing location
      this.showProcessingAlert('Helyszín módosítása folyamatban...');
      this.locService.updateLocation(this.editingLocationId, locationData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingLocationId = null;
          this.locationForm.reset();
          this.locationImageUrl = null;
          this.pendingLocationImageUrl = null;
          this.prevLocationImageUrl = null;
          this.showLocationImageGallery = false;
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
          this.locationImageUrl = null;
          this.pendingLocationImageUrl = null;
          this.prevLocationImageUrl = null;
          this.showLocationImageGallery = false;
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
    this.locationImageUrl = location.imageUrl || null;
    this.pendingLocationImageUrl = null;
    this.prevLocationImageUrl = null;
    this.showLocationImageGallery = false;
    this.locationForm.patchValue({
      name: location.name,
      address: location.address,
      email: location.email,
      imageUrl: location.imageUrl || ''
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
      sportId: this.fieldForm.value.sportId,
      imageUrl: this.fieldForm.value.imageUrl || ''
    };

    if (this.editingFieldId) {
      // Update existing field
      this.showProcessingAlert('Pálya módosítása folyamatban...');
      this.fieldService.updateField(this.editingFieldId, fieldData).subscribe({
        next: (result: any) => {
          this.showModal = false;
          this.editingFieldId = null;
          this.fieldForm.reset();
          this.fieldImageUrl = null;
          this.pendingFieldImageUrl = null;
          this.prevFieldImageUrl = null;
          this.showFieldImageGallery = false;
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
          this.fieldImageUrl = null;
          this.pendingFieldImageUrl = null;
          this.prevFieldImageUrl = null;
          this.showFieldImageGallery = false;
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
    this.editingFieldId = field.id;
    this.fieldImageUrl = field.imageUrl || null;
    this.pendingFieldImageUrl = null;
    this.prevFieldImageUrl = null;
    this.showFieldImageGallery = false;
    this.fieldForm.patchValue({
      name: field.name,
      locationId: field.locationId,
      sportId: field.sportId,
      imageUrl: field.imageUrl || ''
    });
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

    const sportId = this.parseId(this.bookingForm.value.sportId);
    const locationId = this.parseId(this.bookingForm.value.locationId);
    const fieldId = this.parseId(this.bookingForm.value.fieldId);
    const userId = this.parseId(this.bookingForm.value.userId);
    const priceId = this.parseId(this.bookingForm.value.priceId);
    const date = String(this.bookingForm.value.date ?? '').trim();
    const startTime = this.normalizeTimeForInput(this.bookingForm.value.startTime);
    const endTime = this.normalizeTimeForInput(this.bookingForm.value.endTime);

    if (!sportId || !locationId || !fieldId || !userId || !priceId || !date || !startTime || !endTime) {
      Swal.fire({
        title: 'Hiányzó foglalási adatok',
        text: 'A mentéshez tölts ki minden kötelező mezőt (sport, helyszín, pálya, felhasználó, dátum, időpont, ár).',
        icon: 'warning'
      });
      return;
    }

    const bookingData = {
      sportId,
      locationId,
      fieldId,
      userId,
      priceId,
      date,
      startTime,
      endTime,
      note: String(this.bookingForm.value.note ?? '').trim() || null
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
      endTime: this.normalizeTimeForInput(booking.endTime),
      note: booking.note ?? ''
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
    const currentPriceId = this.parseId(this.bookingForm.value.priceId);
    const firstPriceForField = this.getFilteredPrices()[0];
    const nextPriceId = currentPriceId || Number(firstPriceForField?.id || 0);

    this.bookingForm.patchValue({
      date: '',
      startTime: '',
      endTime: '',
      priceId: nextPriceId > 0 ? String(nextPriceId) : ''
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

  getFieldLocationName(fieldId: number): string {
    if (!this.fields || !this.locations) return 'N/A';
    const field = (this.fields as any[]).find((f: any) => Number(f?.id) === Number(fieldId));
    if (!field) return 'N/A';
    return this.getLocationName(Number(field.locationId));
  }

  getFieldSportName(fieldId: number): string {
    if (!this.fields || !this.sports) return 'N/A';
    const field = (this.fields as any[]).find((f: any) => Number(f?.id) === Number(fieldId));
    if (!field) return 'N/A';
    return this.getSportName(Number(field.sportId));
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

  getBookingFormTotalPriceValue(): string {
    const priceId = this.parseId(this.bookingForm.value.priceId);
    if (!priceId) {
      return 'N/A';
    }

    const pricePerHour = Number((this.prices as any[] | undefined)?.find((p: any) => Number(p?.id) === priceId)?.price ?? NaN);
    if (!Number.isFinite(pricePerHour)) {
      return 'N/A';
    }

    const startMinutes = this.parseTimeToMinutes(this.bookingForm.value.startTime);
    const endMinutes = this.parseTimeToMinutes(this.bookingForm.value.endTime);
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
