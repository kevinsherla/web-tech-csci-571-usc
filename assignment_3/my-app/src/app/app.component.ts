import { Component, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FormControl, NgForm } from '@angular/forms';
import { SharedDataService } from './shared-data.service';
import { EbayItemsComponent } from './ebay-items/ebay-items.component';
import { RoundProgressModule } from 'angular-svg-round-progressbar';

interface FormData {
  keyword: string;
  category: string;
  condition: {
    new: boolean;
    used: boolean;
    unspecified: boolean;
  };
  shipping: {
    localPickup: boolean;
    freeShipping: boolean;
  };
  distance: number;
  zipCode: string;
}

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
interface BackendParams {
  [key: string]: any; // 'any' type used here for simplicity; you can replace it with a more specific type if needed.
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
  app_key = "KevinShe-assignme-PRD-c727b8eb0-b55a0d9c";
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
          return this.http.get<any>('https://assignment3-404507.wl.r.appspot.com/api/zip-code-suggestions?val=' + val);
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

  prepareDataForBackend(formData: FormData): BackendParams {
    let params: BackendParams = {
      'OPERATION-NAME': 'findItemsAdvanced',
      'paginationInput.entriesPerPage': 50,
      'SERVICE-VERSION': '1.0.0',
      'SECURITY-APPNAME': this.app_key,
      'RESPONSE-DATA-FORMAT': 'JSON',
      'REST-PAYLOAD': '',
      'keywords': formData.keyword,
      'buyerPostalCode': formData.zipCode,
    };

    let filterIndex = 0;

    if (formData.category && formData.category.toLowerCase() !== 'all') {
      params['categoryId'] = formData.category;
    }

    params[`itemFilter(${filterIndex}).name`] = 'MaxDistance';
    params[`itemFilter(${filterIndex}).value`] = formData.distance.toString();
    filterIndex++;

    // Process conditions
    let conditionValues: string[] = [];
    if (formData.condition.new) conditionValues.push('1000');
    if (formData.condition.used) conditionValues.push('3000');
    if (conditionValues.length > 0) {
      params[`itemFilter(${filterIndex}).name`] = 'Condition';
      conditionValues.forEach((value, index) => {
        params[`itemFilter(${filterIndex}).value(${index})`] = value;
      });
      filterIndex++;
    }

    // Process shipping
    if (formData.shipping.freeShipping) {
      params[`itemFilter(${filterIndex}).name`] = 'FreeShippingOnly';
      params[`itemFilter(${filterIndex}).value`] = 'true';
      filterIndex++;
    }
    if (formData.shipping.localPickup) {
      params[`itemFilter(${filterIndex}).name`] = 'LocalPickupOnly';
      params[`itemFilter(${filterIndex}).value`] = 'true';
      filterIndex++;
    }

    // Add more conditions or filters as needed...

    return params; // Return the prepared params
  }

  sendFormDataToBackend() {
    var data = {
      params: this.formData,
    }

    const backendUrl = 'http://localhost:3000/api/ebay-search?';
    const preparedParams = this.prepareDataForBackend(this.formData);
    this.child.loading = true;
    this.http.get(backendUrl, { params: preparedParams }).subscribe((response: any) => {
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

