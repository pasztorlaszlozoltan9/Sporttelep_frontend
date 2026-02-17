import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SportService } from '../shared/sport.service';
import { LocService } from '../shared/loc.service';
import { FieldService } from '../shared/field.service';
import { AvailabledateService } from '../shared/availabledate.service';
import { PriceService } from '../shared/price.service';
import { BookingService } from '../shared/booking.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  sportList: any[] = [];
  locList: any[] = [];
  fieldsList: any[] = [];
  datesList: any[] = [];
  pricesList: any[] = [];
  bookingsList: any[] = [];
  userId: number | null = null;

  selectedSportId: number | null = null;
  selectedLocationId: number | null = null;
  selectedFieldId: number | null = null;
  selectedDate: string | null = null;
  selectedSlot: any = null;
  selectedPrice: any = null;
  selectedPriceId: number | null = null;
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
    this.fieldService.getFields().subscribe({ next: (res: any) => this.fieldsList = res.data ?? res ?? [] });
    this.availableDateService.getAvailableDates().subscribe({ next: (res: any) => this.datesList = res.data ?? res ?? [] });
    this.priceService.getPrices().subscribe({ next: (res: any) => this.pricesList = res.data ?? res ?? [] });
    this.bookingService.getBookings().subscribe({ next: (res: any) => this.bookingsList = res.data ?? res ?? [] });
  }
  selectSport(sport: any): void {
    this.selectedSportId = sport?.id ?? null;
    this.selectedLocationId = null;
    this.selectedFieldId = null;
    this.selectedDate = null;
    this.selectedSlot = null;
    this.selectedPrice = null;
    this.selectedPriceId = null;
  }

  selectLocation(loc: any): void {
    this.selectedLocationId = loc?.id ?? null;
    this.selectedFieldId = null;
    this.selectedDate = null;
    this.selectedSlot = null;
    this.selectedPrice = null;
    this.selectedPriceId = null;
  }

  selectField(field: any): void {
    this.selectedFieldId = field?.id ?? null;
    const price = this.pricesList.find(p => p.fieldId === this.selectedFieldId);
    this.selectedPrice = price?.price ?? null;
    this.selectedPriceId = price?.id ?? null;
    this.selectedDate = null;
    this.selectedSlot = null;
  }

  selectDate(dateStr: string): void {
    this.selectedDate = dateStr;
    this.selectedSlot = null;
  }

  selectSlot(time: any): void {
    this.selectedSlot = time;
  }

  private normalizeDateStr(d: string): string {
    return (d ?? '').includes('T') ? d.split('T')[0] : d;
  }

  get filteredLocations(): any[] {
    if (!this.selectedSportId) return [];
    return this.locList.filter(loc =>
      this.fieldsList.some(f => f.sportId === this.selectedSportId && f.locationId === loc.id)
    );
  }

  get filteredFields(): any[] {
    if (!this.selectedSportId || !this.selectedLocationId) return [];
    return this.fieldsList.filter(f =>
      f.sportId === this.selectedSportId && f.locationId === this.selectedLocationId
    );
  }

  get availableDates(): string[] {
    if (!this.selectedFieldId) return [];
    const slots = this.datesList.filter(d => d.fieldId === this.selectedFieldId && !this.isSlotBooked(d.id));
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
      alert('Foglaláshoz be kell jelentkezned! Kérjük, bejelentkezz vagy regisztrálj.');
      this.router.navigate(['/login']);
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

