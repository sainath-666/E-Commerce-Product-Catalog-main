import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { retry } from 'rxjs/operators';
import { CartService } from '../../../../core/services/cart.service';
import { CartItem } from '../../../../core/models/cart-item.model';
import { ProductService } from '../../../../core/services/product.service';

@Component({
  selector: 'app-cart-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cart-list.component.html',
  styleUrl: './cart-list.component.css',
})
export class CartListComponent implements OnInit {
  cartItems: CartItem[] = [];
  loading = false;

  constructor(
    private cartService: CartService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadCartItemsWithDetails();
  }

  loadCartItemsWithDetails(): void {
    this.loading = true;
    this.cartService.getCartItems().subscribe({
      next: (items) => {
        console.log('Cart items received:', items);
        if (!items || items.length === 0) {
          this.cartItems = [];
          this.loading = false;
          return;
        }
        // Fetch product details for each cart item
        let loadedCount = 0;
        this.cartItems = items;
        items.forEach((item, idx) => {
          this.productService.getProduct(item.productId).subscribe({
            next: (product) => {
              this.cartItems[idx].product = product;
              loadedCount++;
              if (loadedCount === items.length) {
                this.loading = false;
              }
            },
            error: (error) => {
              console.error(
                'Error loading product details for cart item:',
                item.productId,
                error
              );
              loadedCount++;
              if (loadedCount === items.length) {
                this.loading = false;
              }
            },
          });
        });
      },
      error: (error) => {
        console.error('Error loading cart items:', error);
        this.cartItems = [];
        this.loading = false;
      },
    });
  }

  incrementQuantity(cartItemId: number): void {
    const item = this.cartItems.find((i) => i.cartItemId === cartItemId);
    if (!item) {
      console.error('Item not found:', cartItemId);
      return;
    }

    const newQuantity = item.quantity + 1;
    console.log(
      'Incrementing quantity for item:',
      item.cartItemId,
      'to',
      newQuantity
    );

    // Don't allow negative or zero quantities
    if (newQuantity <= 0) return;

    this.loading = true;

    this.cartService.updateQuantity(cartItemId, newQuantity).subscribe({
      next: () => {
        console.log('Successfully incremented quantity');
        this.loading = false;
        this.loadCartItemsWithDetails(); // Reload to sync with server
      },
      error: (error) => {
        console.error('Error incrementing quantity:', error);
        this.loading = false;
        // Error will be handled by the service
        this.loadCartItemsWithDetails(); // Reload to ensure correct state
      },
    });
  }

  getTotalItems(): number {
    return this.cartItems.reduce((total, item) => total + item.quantity, 0);
  }

  decrementQuantity(cartItemId: number): void {
    const item = this.cartItems.find((i) => i.cartItemId === cartItemId);
    if (!item) {
      console.error('Item not found:', cartItemId);
      return;
    }

    if (item.quantity <= 1) {
      this.removeItem(cartItemId);
      return;
    }

    const newQuantity = item.quantity - 1;
    console.log(
      'Decrementing quantity for item:',
      item.cartItemId,
      'to',
      newQuantity
    );

    // Don't allow negative quantities
    if (newQuantity <= 0) {
      this.removeItem(cartItemId);
      return;
    }

    this.loading = true;
    this.cartService.updateQuantity(cartItemId, newQuantity).subscribe({
      next: () => {
        console.log('Successfully decremented quantity');
        this.loading = false;
        this.loadCartItemsWithDetails(); // Reload to sync with server
      },
      error: (error) => {
        console.error('Error decrementing quantity:', error);
        this.loading = false;
        // Error will be handled by the service
        this.loadCartItemsWithDetails(); // Reload to ensure correct state
      },
    });
  }

  removeItem(cartItemId: number): void {
    this.loading = true;
    this.cartService.removeFromCart(cartItemId).subscribe({
      next: () => {
        console.log('Successfully removed item');
        this.loading = false;
        this.loadCartItemsWithDetails();
      },
      error: (error) => {
        console.error('Error removing item:', error);
        this.loading = false;
        // Reload cart to ensure consistent state
        this.loadCartItemsWithDetails();
      },
    });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      next: () => {
        console.log('Successfully cleared cart');
        this.loadCartItemsWithDetails();
      },
      error: (error) => {
        console.error('Error clearing cart:', error);
      },
    });
  }

  calculateTotal(): number {
    return this.cartItems.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  }
}
