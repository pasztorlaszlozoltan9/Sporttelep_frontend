import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SportService } from '../shared/sport.service';
import { LocService } from '../shared/loc.service';
import { FieldService } from '../shared/field.service';
import { AvailabledateService } from '../shared/availabledate.service';
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
  private readonly defaultCardImage = 'pics/index_background.jpg';

  private readonly sportImageByKey: Record<string, string> = {
    labdarugas: 'labdarúgás.jpg',
    tenisz: 'tenisz.jpg',
    kosarlabda: 'kosárlabda.jpg',
    padel: 'padel.jpg',
    roplabda: 'röplabda.jpg'
  };

  private readonly locationImageByKey: Record<string, string> = {
    'bme sporttelep': 'bme sporttelep.jpg',
    'pokorny jozsef sport es szabadidokozpont': 'Pokorny József Sport- és Szabadidőközpont.jpg',
    'varosligeti sportcentrum': 'városligeti sportcentrum.jpg',
    'ujbudai sportcentrum': 'Újbudai Sportcentrum.jpg',
    'ujpalotai uti sporttelep': 'Újpalotai úti Sporttelep.jpg'
  };

  sportList: any[] = [];
  locList: any[] = [];
  fieldsList: any[] = [];
  datesList: any[] = [];
  pricesList: any[] = [];
  bookingsList: any[] = [];
  userId: number | null = null;

  selectedSportId: number | null = null;
  selectedFilterDate: string = '';
  selectedLocationId: number | null = null;
  selectedFieldId: number | null = null;
  selectedDate: string | null = null;
  selectedSlot: any = null;
  selectedPrice: any = null;
  selectedPriceId: number | null = null;
  private datePickerInstance: any = null;

  @ViewChild('headerDatePicker')
  headerDatePicker?: ElementRef<HTMLInputElement>;

  constructor(
    private sportService: SportService,
    private locService: LocService,
    private fieldService: FieldService,
    private availableDateService: AvailabledateService,
    private priceService: PriceService,
    private bookingService: BookingService,
    private router: Router
  ) { }

  

  ngOnInit(): void {
    this.loadAllData();
    this.loadUserIdFromToken();
  }

  ngAfterViewInit(): void {
    this.initializeHeaderDatePicker();
  }

  ngOnDestroy(): void {
    this.datePickerInstance?.destroy();
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
      onChange: (_selectedDates, dateStr) => {
        this.selectedFilterDate = this.normalizeDateStr(dateStr);
        this.resetSelectionChain();
      }
    });
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
    this.availableDateService.getAvailableDates().subscribe({ next: (res: any) => this.datesList = res.data ?? res ?? [] });
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

  private resetSelectionChain(): void {
    this.selectedLocationId = null;
    this.selectedFieldId = null;
    this.selectedDate = null;
    this.selectedSlot = null;
    this.selectedPrice = null;
    this.selectedPriceId = null;
  }

  selectLocation(loc: any): void {
    const clickedLocationId = loc?.id ?? null;

    if (this.selectedLocationId === clickedLocationId) {
      this.selectedLocationId = null;
      this.selectedFieldId = null;
      this.selectedDate = null;
      this.selectedSlot = null;
      this.selectedPrice = null;
      this.selectedPriceId = null;
      return;
    }

    this.selectedLocationId = clickedLocationId;
    this.selectedFieldId = null;
    this.selectedDate = null;
    this.selectedSlot = null;
    this.selectedPrice = null;
    this.selectedPriceId = null;
  }

  selectField(field: any): void {
    const clickedFieldId = field?.id ?? null;

    if (this.selectedFieldId === clickedFieldId) {
      this.selectedFieldId = null;
      this.selectedDate = null;
      this.selectedSlot = null;
      this.selectedPrice = null;
      this.selectedPriceId = null;
      return;
    }

    this.selectedFieldId = clickedFieldId;
    const price = this.pricesList.find(p => p.fieldId === this.selectedFieldId);
    this.selectedPrice = price?.price ?? null;
    this.selectedPriceId = price?.id ?? null;
    this.selectedDate = null;
    this.selectedSlot = null;
  }

  selectDate(dateStr: string): void {
    const clickedDate = this.normalizeDateStr(dateStr);

    if (this.selectedDate === clickedDate) {
      this.selectedDate = null;
      this.selectedSlot = null;
      return;
    }

    this.selectedDate = clickedDate;
    this.selectedSlot = null;
  }

  selectSlot(time: any): void {
    const clickedSlotId = Number(time?.id ?? NaN);
    const selectedSlotId = Number(this.selectedSlot?.id ?? NaN);

    if (Number.isFinite(clickedSlotId) && Number.isFinite(selectedSlotId) && clickedSlotId === selectedSlotId) {
      this.selectedSlot = null;
      return;
    }

    this.selectedSlot = time;
  }

  private normalizeDateStr(d: string): string {
    return (d ?? '').includes('T') ? d.split('T')[0] : d;
  }

  private normalizeNameKey(value: string): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private encodePathSegments(path: string): string {
    return path
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');
  }

  private mapImagePath(
    folder: 'sports' | 'locations' | 'fields',
    rawName: string,
    mapping?: Record<string, string>
  ): string {
    const trimmedName = String(rawName ?? '').trim();
    if (!trimmedName) {
      return this.defaultCardImage;
    }

    if (mapping) {
      const mapped = mapping[this.normalizeNameKey(trimmedName)];
      if (mapped) {
        return this.encodePathSegments(`pics/${folder}/${mapped}`);
      }
    }

    return this.encodePathSegments(`pics/${folder}/${trimmedName}.jpg`);
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

    return this.datesList.some(d =>
      fieldIds.has(d.fieldId) &&
      this.normalizeDateStr(d.date) === day &&
      !this.isSlotBooked(d.id)
    );
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
    candidates = candidates.filter(field =>
      this.datesList.some(d =>
        d.fieldId === field.id &&
        this.normalizeDateStr(d.date) === day &&
        !this.isSlotBooked(d.id)
      )
    );

    return candidates;
  }

  getLocationCardImage(loc: any): string {
    return this.mapImagePath('locations', String(loc?.name ?? ''), this.locationImageByKey);
  }

  getSportCardImage(sport: any): string {
    return this.mapImagePath('sports', String(sport?.name ?? ''), this.sportImageByKey);
  }

  getFieldCardImage(field: any): string {
    return this.mapImagePath('fields', String(field?.name ?? ''));
  }

  get availableDates(): string[] {
    if (!this.selectedFieldId) return [];
    let slots = this.datesList.filter(d => d.fieldId === this.selectedFieldId && !this.isSlotBooked(d.id));
    if (this.selectedFilterDate) {
      const day = this.normalizeDateStr(this.selectedFilterDate);
      slots = slots.filter(s => this.normalizeDateStr(s.date) === day);
    }
    const uniq = Array.from(new Set(slots.map(s => this.normalizeDateStr(s.date))));
    // sort ascending
    return uniq.sort();
  }

  get timesForSelectedDate(): any[] {
    if (!this.selectedFieldId || !this.selectedDate) return [];
    return this.datesList
      .filter(d =>
        d.fieldId === this.selectedFieldId &&
        this.normalizeDateStr(d.date) === this.selectedDate &&
        !this.isSlotBooked(d.id)
      )
      .sort((a, b) => (a.startTime > b.startTime ? 1 : -1));
  }

  get pricesForSelectedField(): any[] {
    if (!this.selectedFieldId) return [];
    return this.pricesList.filter(p => p.fieldId === this.selectedFieldId);
  }

  private isSlotBooked(availableDateId: number): boolean {
    if (!this.bookingsList) return false;
    return this.bookingsList.some(b => b.availableDateId === availableDateId);
  }

  goToBooking(): void {
    if (!this.userId) {
      this.router.navigate(['/login']);
      Swal.fire("Foglaláshoz be kell jelentkezned! Kérjük, jelentkezz be vagy regisztrálj.");
      return;
    }
    
    this.bookingService.setBookingData({
      sportId: this.selectedSportId,
      locationId: this.selectedLocationId,
      fieldId: this.selectedFieldId,
      userId: this.userId,
      availableDateId: this.selectedSlot?.id,
      priceId: this.selectedPriceId,
      date: this.selectedDate,
      startTime: this.selectedSlot?.startTime
    });
    this.router.navigate(['/booking']);
  }
}

