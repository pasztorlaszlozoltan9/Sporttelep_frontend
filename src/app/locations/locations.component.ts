import { Component } from '@angular/core';
import { LocService } from '../shared/loc.service';

@Component({
  selector: 'app-locations',
  standalone: true,
  imports: [],
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.css']
})
export class LocationsComponent {
  locList!: any;
  constructor(private api: LocService) {  }
  ngOnInit() {
    this.getLocation()
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