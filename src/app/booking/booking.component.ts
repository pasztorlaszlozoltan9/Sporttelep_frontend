import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SportService } from '../shared/sport.service';
import { LocService } from '../shared/loc.service';
import { FieldService } from '../shared/field.service';
import { BookingService } from '../shared/booking.service';
import { UserService } from '../shared/user.service';
import { PriceService } from '../shared/price.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})

export class BookingComponent implements OnInit {
  sportId: number | null = null;
  locationId: number | null = null;
  fieldId: number | null = null;
  date: string | null = null;
  startTime: string | null = null;
  endTime: string | null = null;

  sportName: string = '';
  locationName: string = '';
  fieldName: string = '';
  userEmail: string = '';
  priceId: number | null = null;
  totalPrice: string = '';
  userId: number | null = null;
  bookingNote: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sportService: SportService,
    private locService: LocService,
    private fieldService: FieldService,
    private bookingService: BookingService,
    private userService: UserService,
    private priceService: PriceService
  ) {}

  ngOnInit(): void {
    const bookingData = this.bookingService.getBookingData();
    this.sportId = bookingData.sportId ? Number(bookingData.sportId) : null;
    this.locationId = bookingData.locationId ? Number(bookingData.locationId) : null;
    this.fieldId = bookingData.fieldId ? Number(bookingData.fieldId) : null;
    this.userId = bookingData.userId ? Number(bookingData.userId) : null;
    this.date = bookingData.date || null;
    this.startTime = bookingData.startTime || null;
    this.endTime = bookingData.endTime || null;
    this.priceId = bookingData.priceId ? Number(bookingData.priceId) : null;

    if (this.sportId && this.locationId && this.fieldId && this.userId) {
      this.loadBookingDetails();
    }
  }

  loadBookingDetails(): void {
    // Fetch sport name
    this.sportService.getSport().subscribe({
      next: (res: any) => {
        const sport = (res.data ?? res).find((s: any) => s.id === this.sportId);
        this.sportName = sport?.name || 'N/A';
      }
    });

    // Fetch location name
    this.locService.getLocation().subscribe({
      next: (res: any) => {
        const loc = (res.data ?? res).find((l: any) => l.id === this.locationId);
        this.locationName = loc?.name || 'N/A';
      }
    });

    // Fetch field name
    this.fieldService.getField().subscribe({
      next: (res: any) => {
        const field = (res.data ?? res).find((f: any) => f.id === this.fieldId);
        this.fieldName = field?.name || 'N/A';
      }
    });
  

    // Fetch user email
    this.userService.getUser().subscribe({
      next: (res: any) => {
        const users = res.data ?? res;
        const user = (users as any[]).find((u: any) => Number(u.id) === Number(this.userId));
        this.userEmail = user?.email || 'N/A';
      }
    });

    // Resolve base price and calculate total based on selected duration.
    this.priceService.getPrices().subscribe({
      next: (res: any) => {
        const prices = res.data ?? res;
        const selectedPrice = (prices as any[]).find((p: any) => Number(p.id) === Number(this.priceId));
        const hourlyPrice = Number(selectedPrice?.price ?? NaN);
        const duration = this.getDurationMinutes();

        if (!Number.isFinite(hourlyPrice)) {
          this.totalPrice = 'N/A';
          return;
        }

        const amount = (hourlyPrice * duration) / 60;
        this.totalPrice = `${Number(amount.toFixed(2))} Ft`;
      }
    });
  }

  private parseTimeToMinutes(value: string | null): number | null {
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

  private getDurationMinutes(): number {
    const start = this.parseTimeToMinutes(this.startTime);
    const end = this.parseTimeToMinutes(this.endTime);
    if (start === null || end === null || end <= start) {
      return 60;
    }
    return end - start;
  }



  onSubmit(): void {
    this.bookingService.setBookingData({
      sportId: this.sportId,
      locationId: this.locationId,
      fieldId: this.fieldId,
      userId: this.userId,
      priceId: this.priceId,
      date: this.date,
      startTime: this.startTime,
      endTime: this.endTime,
      note: this.bookingNote?.trim() || null
    });

    this.router.navigate(['/payment']);
  }

  goBack(): void {
    this.router.navigate(['/main']);
  }
}

