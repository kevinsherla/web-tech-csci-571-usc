import { Component, OnInit, ViewChild } from '@angular/core';
import { SharedDataService } from '../shared-data.service';
import { ItemDetailComponent } from '../item-detail/item-detail.component';

@Component({
  selector: 'app-ebay-items',
  templateUrl: './ebay-items.component.html',
  styleUrls: ['./ebay-items.component.css']
})
export class EbayItemsComponent {
  @ViewChild(ItemDetailComponent, { static: true })
  child: ItemDetailComponent = new ItemDetailComponent();
  noRecords: boolean = false;
  showingResults = true;
  showingWishlist = false;
  ebayItems: any[] = [];
  isSearchClicked: boolean = false;
  loading: boolean = false;
  currentPage: number = 1;
  itemsPerPage: number = 10;
  selectedImage: string = '';
  showTooltip: boolean = false;
  selectedItemId: number | null = null;

  totalPages: number = Math.ceil(this.ebayItems.length / this.itemsPerPage);
  constructor() { }

  submitValues(items: any[]) {
    console.log(items);
    this.isSearchClicked = true;
    // Assuming the 'items' parameter contains the new list of eBay items:
    this.noRecords = items.length === 0;
    this.ebayItems = items;
    this.loading = false;
    this.totalPages = Math.ceil(this.ebayItems.length / this.itemsPerPage);
  }

  getFirst(arr: any[]): any {
    return arr && arr.length > 0 ? arr[0] : '';
  }

  onSearchButtonClick() {
    this.isSearchClicked = true;
  }
  getDisplayedItems(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.ebayItems.slice(start, end);
  }
  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  getPageNumbers() {
    const pagesToShow = 5;
    const currentPageIndex = this.currentPage - 1;
    const start = Math.max(1, currentPageIndex - Math.floor(pagesToShow / 2));
    const end = Math.min(this.totalPages, start + pagesToShow - 1);

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  goToPage(page: number) {
    this.currentPage = page;
  }
  truncateTitle(title: string): string {
    if (title.length > 35) {
      return title.substr(0, 35) + '...';
    }
    return title;
  }
  showResults(): void {
    this.showingResults = true;
    this.showingWishlist = false;
    // Fetch eBay items here
  }

  showWishlist(): void {
    this.showingResults = false;
    this.showingWishlist = true;
    // Fetch wishlist items here
  }

  printItemID(item: any): void {
    // console.log(item.itemId);
    this.selectedItemId = item.itemId;
    this.child.callApi(item.itemId);
  }
}
