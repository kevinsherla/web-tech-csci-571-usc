import { Component, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FormControl, NgForm } from '@angular/forms';
import { SharedDataService } from './shared-data.service';
import { EbayItemsComponent } from './ebay-items/ebay-items.component';
import { RoundProgressModule } from 'angular-svg-round-progressbar';

interface IpInfoResponse {
  ip: string;
  hostname: string;
  city: string;
  region: string;
  country: string;
  loc: string;
  org: string;
  postal: string;
  timezone: string;
}

interface PostalCodeResponse {
  postalCodes: Array<{
    postalCode: string;
    placeName: string;
  }>;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild(EbayItemsComponent, { static: true })
  child: EbayItemsComponent = new EbayItemsComponent();
  title = 'my-app';
  fetchCurrentLocationZipCode: boolean = false;
  showDropdown: boolean = false;
  otherLocationSelected: boolean = false;
  formData: any = {
    keyword: '',
    category: 'all',
    condition: {
      new: false,
      used: false,
      unspecified: false
    },
    shipping: {
      localPickup: false,
      freeShipping: false
    },
    distance: 10,
    from: 'currentLocation',
    zipCode: ''
  };

  zipCodeControl = new FormControl<string>({ value: '', disabled: true });
  zipSuggestions: any[] = [];

  constructor(private http: HttpClient, private sharedDataService: SharedDataService, private cdr: ChangeDetectorRef) {
    this.zipCodeControl.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      switchMap(val => {
        if (val && val.length >= 0) {
          return this.http.get<any>('http://localhost:3000/api/zip-code-suggestions?val=' + val);
        } else {
          return [];
        }
      })
    ).subscribe(response => {
      this.zipSuggestions = response || [];
    });
  }

  resetForm() {
    // console.log("1st", this.child.loading);
    this.formData = {
      keyword: '',
      category: 'all',
      condition: {
        new: false,
        used: false,
        unspecified: false
      },
      shipping: {
        localPickup: false,
        freeShipping: false
      },
      distance: 10,
      from: 'currentLocation', // Set the radio button value to "currentLocation"
      zipCode: ''
    };
    // console.log("2nd", this.child.loading);
  }

  resetEbayItems() {
    this.child.reset(); // Call the reset method in the child component
  }
  onCurrentLocationSelected() {
    this.fetchCurrentLocationZipCode = true;
  }

  onSubmit() {
    if (this.formData.from === 'currentLocation') {
      const ipInfoUrl = 'https://ipinfo.io/json?token=fd8f991c1a1511';
      this.http.get<IpInfoResponse>(ipInfoUrl).subscribe(data => {
        this.formData.zipCode = data.postal;
        this.sendFormDataToBackend();
      }, error => {
        console.error("Error fetching location:", error);
      });
    } else {
      this.formData.zipCode = this.zipCodeControl.value;
      this.sendFormDataToBackend();
    }
  }
  sendFormDataToBackend() {
    const backendUrl = 'http://localhost:3000/api/ebay-search';
    this.child.loading = true;
    this.http.post(backendUrl, this.formData).subscribe((response: any) => {
      console.log(response);
      const items = response.findItemsAdvancedResponse[0].searchResult[0].item;
      if (items && Array.isArray(items)) {
        this.child.submitValues(items);
        this.sharedDataService.setEbayData(items);
      } else {
        console.error("Unexpected data format from backend.");
        this.child.submitValues([]);
      }
    }, error => {
      console.error(error);
    });
  }
  otherSelected(): boolean {
    const isSelected = this.formData.from === 'otherLocation';

    if (isSelected) {
      const hasDigit = /\d/.test(this.zipCodeControl.value || '');

      if (hasDigit) {
        this.zipCodeControl.setErrors(null);
      } else {
        this.zipCodeControl.setErrors({ 'invalidZipCode': true });
      }

      this.zipCodeControl.enable();
    } else {
      this.zipCodeControl.disable();
    }

    return isSelected;
  }
  selectZip(suggestion: any) {
    this.zipCodeControl.setValue(suggestion.postalCode);
    this.zipSuggestions = [];
  }
  onFocus() {
    this.showDropdown = true;
    this.zipCodeControl.updateValueAndValidity();
  }

  onBlur() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 150);
  }

}

