import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SportService } from '../shared/sport.service';
import { LocService } from '../shared/loc.service';
import { FieldService } from '../shared/field.service';
import { AvailabledateService } from '../shared/availabledate.service';
import { PriceService } from '../shared/price.service';
import { timeInterval } from 'rxjs';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  sportList: any[] = [];
  locList: any[] = [];
  fieldsList: any[] = [];
  datesList: any[] = [];
  pricesList: any[] = [];

  selectedSportId: number | null = null;
  selectedLocationId: number | null = null;
  selectedFieldId: number | null = null;
  selectedDate: string | null = null;
  selectedSlot: any = null;
  selectedPrice: string = '';

  constructor(
    private sportService: SportService,
    private locService: LocService,
    private fieldService: FieldService,
    private availableDateService: AvailabledateService,
    private priceService: PriceService
  ) { }

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.sportService.getSport().subscribe({ next: (res: any) => this.sportList = res.data ?? res ?? [] });
    this.locService.getLocation().subscribe({ next: (res: any) => this.locList = res.data ?? res ?? [] });
    this.fieldService.getFields().subscribe({ next: (res: any) => this.fieldsList = res.data ?? res ?? [] });
    this.availableDateService.getAvailableDates().subscribe({ next: (res: any) => this.datesList = res.data ?? res ?? [] });
    this.priceService.getPrices().subscribe({ next: (res: any) => this.pricesList = res.data ?? res ?? [] });
  }
  selectSport(sport: any): void {
    this.selectedSportId = sport?.id ?? null;
    this.selectedLocationId = null;
    this.selectedFieldId = null;
    this.selectedDate = null;
    this.selectedSlot = null;
  }

  selectLocation(loc: any): void {
    this.selectedLocationId = loc?.id ?? null;
    this.selectedFieldId = null;
    this.selectedDate = null;
    this.selectedSlot = null;
  }

  selectField(field: any): void {
    this.selectedFieldId = field?.id ?? null;
    this.selectedDate = null;
    this.selectedSlot = null;
  }

  selectDate(dateStr: string): void {
    this.selectedDate = dateStr;
    this.selectedSlot = null;
  }

  selectSlot(time: any): void {
    this.selectedSlot = time;
  }


  private normalizeDateStr(d: string): string {
    return (d ?? '').includes('T') ? d.split('T')[0] : d;
  }

  get filteredLocations(): any[] {
    if (!this.selectedSportId) return [];
    return this.locList.filter(loc =>
      this.fieldsList.some(f => f.sportId === this.selectedSportId && f.locationId === loc.id)
    );
  }

  get filteredFields(): any[] {
    if (!this.selectedSportId || !this.selectedLocationId) return [];
    return this.fieldsList.filter(f =>
      f.sportId === this.selectedSportId && f.locationId === this.selectedLocationId
    );
  }

  get availableDates(): string[] {
    if (!this.selectedFieldId) return [];
    const slots = this.datesList.filter(d => d.fieldsId === this.selectedFieldId);
    const uniq = Array.from(new Set(slots.map(s => this.normalizeDateStr(s.date))));
    // sort ascending
    return uniq.sort();
  }

  get timesForSelectedDate(): any[] {
    if (!this.selectedFieldId || !this.selectedDate) return [];
    return this.datesList
      .filter(d => d.fieldsId === this.selectedFieldId && this.normalizeDateStr(d.date) === this.selectedDate)
      .sort((a, b) => (a.startTime > b.startTime ? 1 : -1));
  }
}