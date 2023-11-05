import { Component, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { SharedDataService } from './shared-data.service';
import { EbayItemsComponent } from './ebay-items/ebay-items.component';



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
    from: 'currentLocation', // default to 'currentLocation'
    zipCode: ''
  };

  zipCodeControl = new FormControl();
  zipSuggestions: any[] = [];

  constructor(private http: HttpClient, private sharedDataService: SharedDataService) {
    this.zipCodeControl.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      switchMap(val => {
        if (val && val.length >= 1) {
          const apiUrl = `http://api.geonames.org/postalCodeSearchJSON?postalcode_startsWith=${val}&country=US&maxRows=5&username=kevin.sherla`;
          return this.http.get<PostalCodeResponse>(apiUrl);
        } else {
          return [];
        }
      })
    ).subscribe(response => {
      this.zipSuggestions = response.postalCodes || [];
    });
  }

  onCurrentLocationSelected() {
    this.fetchCurrentLocationZipCode = true;
  }

  onSubmit() {
    if (this.formData.from === 'currentLocation') {
      const ipInfoUrl = 'https://ipinfo.io/json?token=fd8f991c1a1511';
      this.http.get<IpInfoResponse>(ipInfoUrl).subscribe(data => {
        // console.log("Fetched data:", data);
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
    const backendUrl = 'http://localhost:3000/api/ebay-search'; // Change this to your backend URL
    this.child.loading = true;
    this.http.post(backendUrl, this.formData).subscribe((response: any) => {
      console.log(response);

      // Navigate through the nested response to get the item array
      const items = response.findItemsAdvancedResponse[0].searchResult[0].item;

      // Ensure that we have valid items before passing to setEbayData
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
    return this.formData.from === 'otherLocation';
  }

  selectZip(suggestion: any) {
    this.zipCodeControl.setValue(suggestion.postalCode);
    this.zipSuggestions = [];
  }
  onFocus() {
    this.showDropdown = true;
  }

  onBlur() {
    setTimeout(() => this.showDropdown = false, 150);
  }
}

