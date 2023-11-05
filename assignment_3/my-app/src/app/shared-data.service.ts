import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedDataService {
  private ebayDataSubject = new BehaviorSubject<any[]>([]);
  ebayData$ = this.ebayDataSubject.asObservable();

  constructor() { }
  private ebayData: any[] = [];

  setEbayData(data: any[]) {
    this.ebayData = data;
  }

  getEbayData() {
    return this.ebayData;
  }

}
