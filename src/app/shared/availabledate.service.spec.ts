import { TestBed } from '@angular/core/testing';

import { AvailabledateService } from './availabledate.service';

describe('AvailabledateService', () => {
  let service: AvailabledateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AvailabledateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
