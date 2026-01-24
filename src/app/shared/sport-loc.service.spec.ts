import { TestBed } from '@angular/core/testing';

import { SportLocService } from './sport-loc.service';

describe('SportLocService', () => {
  let service: SportLocService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SportLocService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
