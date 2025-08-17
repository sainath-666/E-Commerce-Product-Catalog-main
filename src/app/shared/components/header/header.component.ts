import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="bg-dark text-white py-2">
      <nav class="container navbar navbar-expand-lg navbar-dark py-0">
        <a class="navbar-brand py-1" routerLink="/">E-Commerce Catalog</a>
        <button class="navbar-toggler py-1" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link py-2" routerLink="/products" routerLinkActive="active">Products</a>
            </li>
            <li class="nav-item">
              <a class="nav-link py-2" routerLink="/categories" routerLinkActive="active">Categories</a>
            </li>
          </ul>
          <div class="d-flex align-items-center">
            <a class="btn btn-outline-light btn-sm position-relative py-1" 
               routerLink="/cart" 
               (click)="loadCart()">
              <i class="bi bi-cart"></i> Cart
              <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" *ngIf="cartItemCount > 0">
                {{cartItemCount}}
              </span>
            </a>
          </div>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .nav-link.active {
      font-weight: bold;
      color: #fff !important;
    }

    .navbar-brand {
      font-size: 1.2rem;
      font-weight: bold;
    }

    .badge {
      font-size: 0.7rem;
      margin-left: 0.5rem;
    }
  `]
})
export class HeaderComponent implements OnInit {
  cartItemCount = 0;
  private cartSubscription: any;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    // We'll subscribe to cart count updates but won't trigger initial load
    this.cartSubscription = this.cartService.getCartItemCount().subscribe(
      count => this.cartItemCount = count
    );
  }

  loadCart(): void {
    // Force cart to load when cart button is clicked
    this.cartService.getCartItems().subscribe();
  }
}
