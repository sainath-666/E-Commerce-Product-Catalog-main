import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../../core/models/product.model';
import { ProductService } from '../../../../core/services/product.service';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.css',
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  quantity = 1;
  activeImageIndex: number = 0;
  relatedProducts: Product[] = [];

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = +params['id'];
      this.loadProduct(id);
    });
  }

  loadProduct(id: number): void {
    this.productService.getProduct(id).subscribe((product) => {
      this.product = product;
      this.loadRelatedProducts();
    });
  }

  addToCart(): void {
    if (this.product) {
      this.cartService
        .addToCart(this.product.productId, this.quantity)
        .subscribe();
    }
  }

  incrementQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decrementQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  setActiveImage(index: number): void {
    this.activeImageIndex = index;
  }

  shareOnFacebook(): void {
    const url = window.location.href;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank'
    );
  }

  shareOnTwitter(): void {
    const url = window.location.href;
    const text = `Check out ${this.product?.productName} on our store!`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text
      )}&url=${encodeURIComponent(url)}`,
      '_blank'
    );
  }

  copyLink(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    // You might want to add a toast notification here
  }

  private loadRelatedProducts(): void {
    if (this.product) {
      this.productService
        .getProducts(1, 4, this.product.categoryId)
        .subscribe(
          (response) =>
            (this.relatedProducts = response.items.filter(
              (p) => p.productId !== this.product?.productId
            ))
        );
    }
  }
}
