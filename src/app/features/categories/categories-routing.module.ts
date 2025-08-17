import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoryBrowserComponent } from './components/category-browser/category-browser.component';

const routes: Routes = [
  {
    path: '',
    component: CategoryBrowserComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CategoriesRoutingModule { }
