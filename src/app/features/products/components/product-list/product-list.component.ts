/// <reference types="node" />
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { Product } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, InfiniteScrollModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  categories: Category[] = [];
  selectedCategory: number | null = null;
  loading: boolean = false;
  currentPage: number = 1;
  pageSize: number = 12;
  totalProducts: number = 0;
  error: string | null = null;
  
  // Search
  searchQuery: string = '';
  private searchSubject = new Subject<string>();
  private searchSubscription: Subscription | null = null;
  
  // View options
  isGridView: boolean = true;
  ascending: boolean = true;

  private subscriptions: Subscription[] = [];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Setup search with debounce
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      console.log('Search query changed:', query);
      this.currentPage = 1; // Reset to first page
      this.loadProducts(); // Load products immediately
    });

    // Handle URL parameters
    const queryParamsSubscription = this.route.queryParams.subscribe(params => {
      // Handle category filter
      const categoryId = params['categoryId'];
      if (categoryId) {
        this.selectedCategory = parseInt(categoryId, 10);
      } else {
        this.selectedCategory = null;
      }

      // Handle search query
      if (params['searchTerm'] !== undefined) {
        this.searchQuery = params['searchTerm'] || '';
        console.log('Search query from URL:', this.searchQuery);
      }

      // Reset pagination
      this.currentPage = parseInt(params['page'], 10) || 1;
      
      // Load products with current filters
      this.loadProducts();
    });
    this.subscriptions.push(queryParamsSubscription);

    // Load initial data
    this.loadCategories();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        console.log('Categories loaded:', categories);
        this.categories = categories || [];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.error = 'Failed to load categories';
        this.categories = [];
      }
    });
  }

  loadProducts(): void {
    // Clear existing error
    this.error = null;
    
    // Don't load if already loading
    if (this.loading) {
      return;
    }
    
    console.log('Loading products with params:', {
      page: this.currentPage,
      pageSize: this.pageSize,
      category: this.selectedCategory,
      ascending: this.ascending,
      search: this.searchQuery
    });
    
    this.loading = true;
    
    // Ensure search query is properly trimmed and log it
    const searchQuery = this.searchQuery ? this.searchQuery.trim() : undefined;
    console.log('Searching with query:', searchQuery);
    
    this.productService.getProducts(
      this.currentPage,
      this.pageSize,
      this.selectedCategory || undefined,
      this.ascending,
      searchQuery
    ).subscribe({
      next: (response) => {
        console.log('Products response:', response);
        if (!response || !response.items || response.items.length === 0) {
          this.error = 'No products found';
          this.products = [];
          this.totalProducts = 0;
        } else {
          this.products = this.currentPage === 1 
            ? response.items 
            : [...this.products, ...response.items];
          this.totalProducts = response.totalCount;
          console.log('Updated products array:', this.products);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.error = 'Failed to load products';
        this.products = [];
        this.totalProducts = 0;
        this.loading = false;
      }
    });
  }

  toggleView(): void {
    this.isGridView = !this.isGridView;
  }

  toggleSortDirection(): void {
    this.ascending = !this.ascending;
    this.currentPage = 1;
    this.loadProducts();
  }

  onScroll(): void {
    if (this.products.length < this.totalProducts) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  onCategorySelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const categoryId = select.value ? +select.value : null;
    
    // Update URL with the selected category
    if (categoryId) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { categoryId: categoryId },
        queryParamsHandling: 'merge'
      });
    } else {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { categoryId: null },
        queryParamsHandling: 'merge'
      });
    }
  }

  onSearchInput(query: string): void {
    console.log('Search input:', query);
    this.searchQuery = query;
    this.searchSubject.next(query);
    
    // Update URL with the search term
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { searchTerm: query || null },
      queryParamsHandling: 'merge'
    });
  }

  clearSearch(): void {
    console.log('Clearing search');
    this.searchQuery = '';
    this.currentPage = 1;
    
    // Remove search term from URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { searchTerm: null },
      queryParamsHandling: 'merge'
    });
    
    this.loadProducts();
  }

  addToCart(productId: number): void {
    this.cartService.addToCart(productId, 1).subscribe({
      next: (response) => {
        console.log('Product added to cart:', response);
        this.currentPage = 1;
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.error = 'Failed to add product to cart';
      }
    });
  }
}
