import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriesRoutingModule } from './categories-routing.module';
import { CategoryBrowserComponent } from './components/category-browser/category-browser.component';

@NgModule({
  imports: [
    CommonModule,
    CategoriesRoutingModule,
    CategoryBrowserComponent // Import the standalone component
  ]
})
export class CategoriesModule { }
