import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Category } from '../../../../core/models/category.model';
import { CategoryService } from '../../../../core/services/category.service';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-category-browser',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="category-page split-layout">
      <div class="category-left">
        <div class="category-header">
          <h2><span class="material-icons">category</span> Categories</h2>
          <p class="subtitle">Explore our product categories below</p>
        </div>
        <div class="category-content">
          <div *ngIf="loading" class="loading-state">
            <span class="material-icons spin">autorenew</span>
            <span>Loading categories...</span>
          </div>
          <div *ngIf="error" class="error-state">
            <span class="material-icons">error_outline</span>
            <span>{{ error }}</span>
            <button class="retry-btn" (click)="loadCategories()">
              Try Again
            </button>
          </div>
          <div *ngIf="!loading && !error">
            <ng-container *ngIf="categories.length > 0; else noCategories">
              <ul class="category-list">
                <ng-container
                  *ngTemplateOutlet="
                    categoryTree;
                    context: { $implicit: categories }
                  "
                ></ng-container>
              </ul>
            </ng-container>
            <ng-template #noCategories>
              <div class="empty-state">
                <span class="material-icons">search_off</span>
                <span>No categories found.</span>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
      <div class="category-right">
        <div *ngIf="selectedCategory" class="products-section">
          <h3>Products in {{ selectedCategory.categoryName }}</h3>
          <div *ngIf="productsLoading" class="loading-state">
            <span class="material-icons spin">autorenew</span>
            <span>Loading products...</span>
          </div>
          <div *ngIf="productsError" class="error-state">
            <span class="material-icons">error_outline</span>
            <span>{{ productsError }}</span>
          </div>
          <div *ngIf="!productsLoading && !productsError">
            <div *ngIf="products.length > 0; else noProducts">
              <div class="products-list">
                <div *ngFor="let product of products" class="product-card">
                  <img
                    [src]="
                      product.imageUrl ||
                      'https://via.placeholder.com/100x100?text=No+Image'
                    "
                    alt="{{ product.productName }}"
                    class="product-image"
                  />
                  <div class="product-info">
                    <h4>{{ product.productName }}</h4>
                    <p>{{ product.description }}</p>
                    <div class="product-meta">
                      <span class="price">&#36;{{ product.price }}</span>
                      <span
                        class="stock"
                        [class.out-of-stock]="product.stock === 0"
                        >{{
                          product.stock > 0 ? 'In Stock' : 'Out of Stock'
                        }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #noProducts>
              <div class="empty-state">
                <span class="material-icons">inventory_2</span>
                <span>No products found in this category.</span>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>

    <ng-template #categoryTree let-categories>
      <ng-container *ngFor="let category of categories">
        <li
          class="category-item"
          [class.has-children]="category.subCategories?.length"
          [class.selected]="
            selectedCategory?.categoryId === category.categoryId
          "
        >
          <a href="#" (click)="onCategoryClick(category, $event)">
            <span class="category-icon material-icons">folder</span>
            <span class="category-name">{{ category.categoryName }}</span>
            <span *ngIf="category.subCategories?.length" class="category-badge">
              {{ category.subCategories.length }}
            </span>
          </a>
          <ul *ngIf="category.subCategories?.length" class="subcategory-list">
            <ng-container
              *ngTemplateOutlet="
                categoryTree;
                context: { $implicit: category.subCategories }
              "
            ></ng-container>
          </ul>
        </li>
      </ng-container>
    </ng-template>
  `,
  styleUrls: ['./category-browser.component.css'],
})
export class CategoryBrowserComponent implements OnInit {
  onCategoryClick(category: Category, event: Event): void {
    event.preventDefault();
    if (this.selectedCategory?.categoryId === category.categoryId) return;
    this.selectedCategory = category;
    this.products = [];
    this.productsError = null;
    this.productsLoading = true;
    this.productService.getProducts(1, 20, category.categoryId).subscribe({
      next: (result) => {
        this.products = result.items || [];
        this.productsLoading = false;
      },
      error: (err) => {
        this.productsError = 'Failed to load products. Please try again.';
        this.products = [];
        this.productsLoading = false;
      },
    });
  }
  categories: Category[] = [];
  loading: boolean = false;
  error: string | null = null;

  selectedCategory: Category | null = null;
  products: Product[] = [];
  productsLoading: boolean = false;
  productsError: string | null = null;

  constructor(
    private categoryService: CategoryService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.error = null;
    this.selectedCategory = null;
    this.products = [];
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories || [];
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load categories. Please try again.';
        this.categories = [];
        this.loading = false;
      },
    });
  }
}
