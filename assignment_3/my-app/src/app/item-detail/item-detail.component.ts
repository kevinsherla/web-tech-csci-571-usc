import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-item-detail',
  templateUrl: './item-detail.component.html',
  styleUrls: ['./item-detail.component.css']
})
export class ItemDetailComponent {
  @Input() itemId: number | null = null;
  itemDetails: any = '';

  constructor() { }

  activeTab: string = 'Product';

  openTab(tabName: string): void {
    this.activeTab = tabName;
  }

  // Call this method when the item ID input changes
  // getItemDetails() {
  //   if (this.itemId) {
  //     const backendUrl = `http://localhost:3000/api/getItem?itemId=${this.itemId}`;
  //     this.http.get(backendUrl).subscribe(
  //       (response) => {
  //         // Here, just logging the response to the console
  //         console.log(response);
  //       },
  //       (error) => {
  //         console.error('Error fetching item details:', error);
  //       }
  //     );
  //   }
  // }
  callApi(itemId: number) {
    console.log(itemId);
    const backendUrl = `http://localhost:3000/api/getItem?itemId=${itemId}`;

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
}
