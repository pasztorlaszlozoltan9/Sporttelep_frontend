import { Component, OnInit, ViewChild } from '@angular/core';
import { ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LocationsComponent } from './locations/locations.component';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { ContactComponent } from './contact/contact.component';
import { SportsComponent } from './sports/sports.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, LoginComponent, LocationsComponent, MainComponent, ContactComponent, SportsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'Budapest Sporttelepek';
ngOnInit(): void {
  const showNavbarBtn = document.getElementById('showNavbarBtn') as HTMLButtonElement;
  const navUl = document.getElementById('navUl') as HTMLUListElement;

  // Add event listener to the showNavbarBtn
  showNavbarBtn.addEventListener('click', () => {
    navUl.classList.toggle('show-navbar');
  });

  // Add event listener to each navbar link
  const navbarLinks = document.querySelectorAll('#navUl li a');
  navbarLinks.forEach(link => {
    link.addEventListener('click', () => {
      navUl.classList.remove('show-navbar');
    });
  });
}
}
