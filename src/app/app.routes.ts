import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { LocationsComponent } from './locations/locations.component';
import { LoginComponent } from './login/login.component';
import { ContactComponent } from './contact/contact.component';
import { SportsComponent } from './sports/sports.component';
import { BookingComponent } from './booking/booking.component';
import { ProfilComponent } from './profil/profil.component';

export const routes: Routes = [
    { path: '', component: MainComponent },
    { path: 'main', component: MainComponent },
    { path: 'booking', component: BookingComponent},
    { path: 'locations', component: LocationsComponent},
    { path: 'login', component: LoginComponent},
    { path: 'contact', component: ContactComponent},
    { path: 'sports', component: SportsComponent},
    { path: 'profil', component: ProfilComponent}
];