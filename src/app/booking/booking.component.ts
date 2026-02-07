import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BookingService } from '../shared/booking.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.css']
})
export class BookingComponent {

  sportId!: number;
  locationId!: number;
  fieldId!: number;

  freeTimes: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.sportId = params['sportId'];
      this.locationId = params['locationId'];
      this.fieldId = params['fieldId'];

      this.loadFreeTimes();
    });
  }
  loadFreeTimes() {
    this.bookingService.getFreeTimes(this.fieldId).subscribe(times => {
      this.freeTimes = times;
    });
  }

  confirmBooking(time: string) {
    const bookingData = {
      sportId: this.sportId,
      locationId: this.locationId,
      fieldId: this.fieldId,
      startTime: time
    };

    this.bookingService.createBooking(bookingData).subscribe(() => {
      alert('Foglalás sikeresen elküldve!');
    });
  }
}