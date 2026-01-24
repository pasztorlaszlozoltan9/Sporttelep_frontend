import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LocationsComponent } from '../locations/locations.component';
import { LoginComponent } from '../login/login.component';
import { ContactComponent } from '../contact/contact.component';
import { SportsComponent } from '../sports/sports.component';
import { LocService } from '../shared/loc.service';
import { SportService } from '../shared/sport.service';


@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, LoginComponent, LocationsComponent, ContactComponent, SportsComponent,],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {
  title = 'Budapest Sporttelepek';
locations: any;
sports: any;

  sportList!: any;


  locList!: any;
  constructor(private api: LocService, private sportService: SportService) {  }
  ngOnInit() {
    this.getLocation()
    this.getSport()
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
  
}
