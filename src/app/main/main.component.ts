import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LocationsComponent } from '../locations/locations.component';
import { LoginComponent } from '../login/login.component';
import { ContactComponent } from '../contact/contact.component';
import { SportsComponent } from '../sports/sports.component';
import { LocService } from '../shared/loc.service';
import { SportService } from '../shared/sport.service';
import { BookingService } from '../shared/booking.service';
import { FieldService } from '../shared/field.service';
import { BookingComponent } from '../booking/booking.component';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, LoginComponent, LocationsComponent, ContactComponent, SportsComponent, BookingComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {
  title = 'Budapest Sporttelepek';
locations: any;
sports: any;

  sportList!: any;
  locList!: any;
  datesList!: any;
  fieldsList!: any;

  constructor(private api: LocService, private sportService: SportService, private bookingService: BookingService, private fieldService: FieldService) {  }
  ngOnInit() {
    this.getLocation()
    this.getSport()
    this.getAvailableDates()
    this.getFields()
}

  getSport() {
    this.sportService.getSport().subscribe({
      next: (sports: any) => {
        console.log(sports.data)
        this.sportList = sports.data;
      },
      error: () => {},
    });
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

  getAvailableDates(){
    this.bookingService.getAvailableDates().subscribe({
      next: (dates:any) => {
        console.log(dates.data)
        this.datesList = dates.data
      }
    })
  };

  getFields(){
    this.fieldService.getFields().subscribe({
      next: (fields:any) =>{
        console.log(fields.data)
        this.fieldsList = fields.data
      }
    })
  }

  
}
