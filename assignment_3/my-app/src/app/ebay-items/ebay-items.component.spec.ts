import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EbayItemsComponent } from './ebay-items.component';

describe('EbayItemsComponent', () => {
  let component: EbayItemsComponent;
  let fixture: ComponentFixture<EbayItemsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EbayItemsComponent]
    });
    fixture = TestBed.createComponent(EbayItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
