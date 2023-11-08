import { Component, Input, Output, ViewChild, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EbayItemsComponent } from '../ebay-items/ebay-items.component';

interface SimilarItem {
  itemId: string;
  title: string;
  viewItemURL: string;
  timeLeft: string;
  imageURL: string;
  buyItNowPrice: {
    "@currencyId": string;
    "__value__": string;
  };
  shippingCost: {
    "@currencyId": string;
    "__value__": string;
  };
}

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.css']
})

export class ItemDetailComponent {
  @Input() itemId: any = '';
  @Input() isSearchClicked: boolean | null = null;
  @Output() searchClickedChange = new EventEmitter<boolean>();
  itemDetails: any = '';
  photos: any = '';
  itemDetailsBool = false;
  loading: boolean = false;
  similar: any = '';
  sortBy: string = 'default';
  sortDirection: string = 'ascending';
  icon3State = false;


  constructor() {
  }

  activeTab: string = 'Product';

  openTab(tabName: string): void {
    this.activeTab = tabName;
  }

  callApi(itemId: number) {
    this.loading = true;
    console.log(itemId);
    const backendUrl = `http://localhost:3000/api/getItem?itemId=${itemId}`;
    this.itemDetailsBool = true;
    this.isSearchClicked = !this.isSearchClicked;
    this.searchClickedChange.emit(this.isSearchClicked);

    fetch(backendUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        this.itemDetails = data;
        console.log(this.itemDetails);
        this.loading = false;
      })
      .catch(error => {
        console.error('Error fetching item details:', error);
      });
  }
  button1Click(): void {
    console.log('Button 1 was clicked!');
    this.itemDetailsBool = false;
    this.isSearchClicked = !this.isSearchClicked;
    this.searchClickedChange.emit(this.isSearchClicked);
  }

  button2Click(): void {
    console.log('Button 2 was clicked!');
    console.log(this.itemId);
    const link = this.itemId.viewItemURL[0];
    const productName = this.itemId.title[0];
    const price = this.itemId.sellingStatus[0].currentPrice[0].__value__;
    // console.log(link);
    // console.log(productName);
    // console.log(price);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=Buy ${encodeURIComponent(productName)} at ${encodeURIComponent(price)} from ${encodeURIComponent(link)} below.`;
    window.open(facebookUrl, '_blank');
  }

  button3Click(): void {
    console.log(this.itemId);
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(this.itemId),
    };
    fetch('http://localhost:3000/api/saveItem', requestOptions)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Failed to save item');
        }
      })
      .then((data) => {
        console.log('Item saved to MongoDB:', data);
      })
      .catch((error) => {
        console.error('Error saving item:', error);
      });
  }

  onPhotosButtonClick(title: string) {
    this.openTab('Photos');
    this.fetchPhotos(title);
  }

  onSimilarProductsButtonClick(itemTitle: number) {
    this.openTab('SimilarProducts');
    this.fetchSimilarProducts(itemTitle);
  }
  fetchSimilarProducts(itemId: number): void {
    const url = `http://localhost:3000/api/similaritems?itemId=${itemId}`;

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        console.log('Similar Items:', data);
        this.similar = data;
      })
      .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
      });
  }

  fetchPhotos(title: string) {
    const encodedTitle = encodeURIComponent(title);

    fetch(`http://localhost:3000/api/photos?title=${encodedTitle}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        console.log('Photos fetched frontend:', data);
        this.photos = data;
      })
      .catch(error => {
        console.error('Error fetching photos: frontend', error);
      });
  }
  parseTimeLeft(timeLeft: string): string {
    const match = timeLeft.match(/P(\d+)DT(\d+)H/);
    if (match && match.length === 3) {
      const days = match[1];
      return days;
    }
    return 'N/A';
  }


  calculateDaysLeft(timeLeft: string): number {
    const regex = /P(\d+)DT(\d+)H(\d+)M(\d+)S/;
    const matches = regex.exec(timeLeft);
    if (matches) {
      return parseInt(matches[1], 10);
    }
    return 0;
  }

  sortSimilarItems(): void {
    const sortField = this.sortBy;
    const directionMultiplier = this.sortDirection === 'ascending' ? 1 : -1;

    this.similar.sort((a: SimilarItem, b: SimilarItem) => {
      let valueA: string | number = this.getSortValue(a, sortField);
      let valueB: string | number = this.getSortValue(b, sortField);

      if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
        valueA = Number(valueA);
        valueB = Number(valueB);
      }

      if (valueA < valueB) {
        return -1 * directionMultiplier;
      }
      if (valueA > valueB) {
        return 1 * directionMultiplier;
      }
      return 0;
    });
  }

  getSortValue(item: SimilarItem, field: string): string | number {
    switch (field) {
      case 'productName':
        return item.title;
      case 'daysLeft':
        return this.calculateDaysLeft(item.timeLeft);
      case 'price':
        return parseFloat(item.buyItNowPrice["__value__"]);
      case 'shippingCost':
        return parseFloat(item.shippingCost["__value__"]);
      default:
        return item.itemId; // Default sort is by itemId, or you can customize
    }
  }
  selectedImageIndex: number = 0;

  openImageModal(index: number): void {
    this.selectedImageIndex = index;
    const modal = document.getElementById('imageModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
    }
  }

  closeImageModal(): void {
    const modal = document.getElementById('imageModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  navigateImages(direction: number): void {
    const newIndex = this.selectedImageIndex + direction;
    if (newIndex >= 0 && newIndex < this.itemDetails?.Item?.PictureURL.length) {
      this.selectedImageIndex = newIndex;
    }
  }

}