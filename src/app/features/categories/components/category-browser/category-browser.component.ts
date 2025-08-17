import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Category } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-category-browser',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="container mt-4">
      <div class="category-browser mx-auto">
        <div class="card">
          <div class="card-header bg-primary text-white">
            <h5 class="card-title mb-0">Browse Categories</h5>
          </div>
          <div class="card-body p-0">
            <!-- Loading State -->
            <div *ngIf="loading" class="p-4 text-center">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>

            <!-- Error State -->
            <div *ngIf="error" class="p-3 text-center text-danger">
              {{ error }}
              <button class="btn btn-link" (click)="loadCategories()">Try Again</button>
            </div>

            <!-- Content -->
            <div class="list-group list-group-flush" *ngIf="!loading && !error">
              <ng-container *ngIf="categories.length > 0">
                <ng-container *ngTemplateOutlet="categoryTree; context: { $implicit: categories }">
                </ng-container>
              </ng-container>
              <div *ngIf="categories.length === 0" class="p-3 text-center text-muted">
                No categories found.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ng-template #categoryTree let-categories>
      <ng-container *ngFor="let category of categories">
        <a [routerLink]="['/products']" 
           [queryParams]="{ categoryId: category.categoryId }"
           class="list-group-item list-group-item-action"
           [routerLinkActiveOptions]="{exact: true}"
           routerLinkActive="active"
           [class.has-children]="category.subCategories?.length">
          <div class="d-flex justify-content-between align-items-center">
            <span>{{ category.categoryName }}</span>
            <span *ngIf="category.subCategories?.length" 
                  class="badge bg-secondary rounded-pill">
              {{ category.subCategories.length }}
            </span>
          </div>
        </a>
        <div class="ms-3" *ngIf="category.subCategories?.length">
          <ng-container *ngTemplateOutlet="categoryTree; context: { $implicit: category.subCategories }">
          </ng-container>
        </div>
      </ng-container>
    </ng-template>
  `,
  styles: [`
    .category-browser {
      max-width: 600px;
      margin: 0 auto;
    }

    .list-group-item {
      border-radius: 0;
      border-left: none;
      border-right: none;
      transition: all 0.2s ease;
    }

    .list-group-item:first-child {
      border-top: none;
    }

    .list-group-item:hover {
      background-color: #f8f9fa;
      color: #0d6efd;
    }

    .list-group-item.active {
      background-color: #e9ecef;
      color: #0d6efd;
      border-color: rgba(0,0,0,.125);
    }

    .has-children {
      font-weight: 500;
    }

    .badge {
      transition: background-color 0.2s ease;
    }

    .list-group-item:hover .badge {
      background-color: #0d6efd !important;
    }
  `]
})
export class CategoryBrowserComponent implements OnInit {
  categories: Category[] = [];
  loading: boolean = false;
  error: string | null = null;

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.error = null;
    
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        console.log('Categories loaded in browser:', categories);
        this.categories = categories || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.error = 'Failed to load categories. Please try again.';
        this.categories = [];
        this.loading = false;
      }
    });
  }
}
