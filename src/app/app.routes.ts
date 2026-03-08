import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { LocationsComponent } from './locations/locations.component';
import { LoginComponent } from './login/login.component';
import { ContactComponent } from './contact/contact.component';
import { SportsComponent } from './sports/sports.component';
import { BookingComponent } from './booking/booking.component';
import { ProfilComponent } from './profil/profil.component';
import { AdminComponent } from './admin/admin.component';
import { AdminGuard } from './shared/admin.guard';
import { RegisterComponent } from './register/register.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { PaymentComponent } from './payment/payment.component';

export const routes: Routes = [
    { path: '', component: MainComponent },
    { path: 'main', component: MainComponent },
    { path: 'booking', component: BookingComponent},
    { path: 'payment', component: PaymentComponent},
    { path: 'locations', component: LocationsComponent},
    { path: 'login', component: LoginComponent},
    { path: 'contact', component: ContactComponent},
    { path: 'sports', component: SportsComponent},
    { path: 'profil', component: ProfilComponent},
    { path: 'admin', component: AdminComponent, canActivate: [AdminGuard]},
    { path: '', component: RegisterComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'verify-email/:token', component: VerifyEmailComponent}
];
