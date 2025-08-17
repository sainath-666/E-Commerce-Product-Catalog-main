import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  cartItemCount = 0;
  isMenuOpen = false;
  private cartSubscription: any;

  constructor(private cartService: CartService, private router: Router) {}
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  ngOnInit(): void {
    this.cartSubscription = this.cartService
      .getCartItemCount()
      .subscribe((count) => (this.cartItemCount = count));
  }

  loadCart(): void {
    this.cartService.getCartItems().subscribe();
  }

  onSearch(event: Event) {
    event.preventDefault();
    // Implement search functionality if needed
  }
}
