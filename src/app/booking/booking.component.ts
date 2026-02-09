import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SportService } from '../shared/sport.service';
import { LocService } from '../shared/loc.service';
import { FieldService } from '../shared/field.service';
import { BookingService } from '../shared/booking.service';

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
  slotId: number | null = null;

  sportName: string = '';
  locationName: string = '';
  fieldName: string = '';
  price: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sportService: SportService,
    private locService: LocService,
    private fieldService: FieldService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.sportId = params['sportId'] ? +params['sportId'] : null;
      this.locationId = params['locationId'] ? +params['locationId'] : null;
      this.fieldId = params['fieldId'] ? +params['fieldId'] : null;
      this.date = params['date'] || null;
      this.startTime = params['startTime'] || null;
      this.slotId = params['slotId'] ? +params['slotId'] : null;

      if (this.sportId && this.locationId && this.fieldId) {
        this.loadBookingDetails();
      }
    });
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

    // Fetch field name and price
    this.fieldService.getFields().subscribe({
      next: (res: any) => {
        const field = (res.data ?? res).find((f: any) => f.id === this.fieldId);
        this.fieldName = field?.name || 'N/A';
        this.price = field?.price || 'N/A';
      }
    });
  }

  onSubmit(): void {
    const bookingData = {
      sportId: this.sportId,
      locationId: this.locationId,
      fieldId: this.fieldId,
      date: this.date,
      startTime: this.startTime,
      slotId: this.slotId,
      price: this.price
    };

    console.log('Booking submitted:', bookingData);

    // Call booking service to save
    // this.bookingService.create(bookingData).subscribe({...});
  }

  goBack(): void {
    this.router.navigate(['/main']);
  }
}
