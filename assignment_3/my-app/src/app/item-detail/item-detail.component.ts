import { Component, Input, Output, ViewChild, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EbayItemsComponent } from '../ebay-items/ebay-items.component';

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

  constructor() {
  }

  activeTab: string = 'Product';

  openTab(tabName: string): void {
    this.activeTab = tabName;
  }

  callApi(itemId: number) {
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
        return response.json();  // Parse JSON response into native JavaScript objects
      })
      .then(data => {
        // Do something with the data
        this.itemDetails = data;
        console.log(this.itemDetails);
      })
      .catch(error => {
        // Handle any errors here
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
    // console.log(this.itemId);
  }

  button3Click(): void {
    console.log('Button 3 was clicked!');
  }

  onPhotosButtonClick(title: string) {
    this.openTab('Photos');
    this.fetchPhotos(title);
  }

  onSimilarProductsButtonClick(itemTitle: number) {
    this.openTab('SimilarProducts');
    this.fetchSimilarProducts(itemTitle);
  }
  fetchSimilarProducts(id: number) {
    console.log(id);
  }
  fetchPhotos(title: string) {
    // Encode the title to be used in a query parameter
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
        // Process the response and update your UI as needed
      })
      .catch(error => {
        console.error('Error fetching photos: frontend', error);
      });
  }
}