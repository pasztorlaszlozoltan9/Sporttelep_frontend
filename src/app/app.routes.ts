import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { LoginComponent } from './login/login.component';
import { ContactComponent } from './contact/contact.component';
import { BookingComponent } from './booking/booking.component';
import { ProfilComponent } from './profil/profil.component';
import { AdminComponent } from './admin/admin.component';
import { AdminGuard } from './shared/admin.guard';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { PaymentComponent } from './payment/payment.component';

export const routes: Routes = [
    { path: '', component: MainComponent },
    { path: 'main', component: MainComponent },
    { path: 'booking', component: BookingComponent},
    { path: 'payment', component: PaymentComponent},
    { path: 'login', component: LoginComponent},
    { path: 'contact', component: ContactComponent},
    { path: 'profil', component: ProfilComponent},
    { path: 'admin', component: AdminComponent, canActivate: [AdminGuard]},
    { path: 'verify-email/:token', component: VerifyEmailComponent},
    { path: 'reset-password/:token', component: ResetPasswordComponent}
];
