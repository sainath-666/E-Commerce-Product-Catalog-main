import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';
import { CartItem } from '../models/cart-item.model';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl: string;
  private cartItems = new BehaviorSubject<CartItem[]>([]);
  private sessionId: string;
  private cartLoaded = false;

  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {
    this.apiUrl = this.apiConfig.getApiUrl('Cart');
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9);
  }

  private loadCart(): void {
    if (this.cartLoaded) return;
    
    // Get sessionId from localStorage or create new one
    const storedSessionId = localStorage.getItem('cartSessionId');
    if (storedSessionId) {
      this.sessionId = storedSessionId;
    } else {
      localStorage.setItem('cartSessionId', this.sessionId);
    }
    
    this.http.get<any>(`${this.apiUrl}/${this.sessionId}`).subscribe({
      next: (response) => {
        console.log('Cart response:', response);
        let cartItems: CartItem[] = [];
        
        if (response.data?.data) {
          cartItems = response.data.data;
        } else if (Array.isArray(response.data)) {
          cartItems = response.data;
        } else if (Array.isArray(response)) {
          cartItems = response;
        }
        
        this.cartItems.next(cartItems);
        this.cartLoaded = true;
      },
      error: (error) => {
        console.error('Error loading cart:', error);
        this.cartItems.next([]);
        this.cartLoaded = true;
      }
    });
  }

  getCartItems(): Observable<CartItem[]> {
    this.loadCart();
    return this.cartItems.asObservable();
  }

  getCartItemCount(): Observable<number> {
    this.loadCart();
    return this.cartItems.pipe(
      map(items => items.reduce((total, item) => total + item.quantity, 0))
    );
  }

  addToCart(productId: number, quantity: number = 1): Observable<CartItem> {
    const payload = {
      sessionId: this.sessionId,
      productId: productId,
      quantity: quantity
    };

    return this.http.post<any>(this.apiUrl, payload).pipe(
      map(response => {
        this.cartLoaded = false;
        this.loadCart();
        
        if (typeof response === 'number') {
          return {
            cartItemId: response,
            sessionId: this.sessionId,
            productId: productId,
            quantity: quantity,
            addedDate: new Date()
          };
        }
        return response.data || response;
      }),
      catchError(this.handleError)
    );
  }

  updateQuantity(cartItemId: number, newQuantity: number): Observable<CartItem> {
    // Simplified PUT request with just the quantity value
    return this.http.put<any>(`${this.apiUrl}/${cartItemId}`, newQuantity).pipe(
      retry(3),
      map(response => {
        console.log('Update response:', response);
        
        // Update local cart immediately for better UX
        const items = this.cartItems.value;
        const index = items.findIndex(item => item.cartItemId === cartItemId);
        if (index !== -1) {
          const updatedItem = { ...items[index], quantity: newQuantity };
          items[index] = updatedItem;
          this.cartItems.next([...items]);
        }
        
        // Reload cart from server to ensure consistency
        this.cartLoaded = false;
        this.loadCart();
        
        return items[index];
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Error updating quantity:', error);
        console.error('Error status:', error.status);
        console.error('Error body:', error.error);
        
        // Force reload cart from server on error
        this.cartLoaded = false;
        this.loadCart();
        
        let errorMessage = 'Failed to update quantity.';
        if (error.status === 400) {
          errorMessage += ' Invalid request format.';
          console.error('Value that caused 400:', newQuantity);
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  removeFromCart(cartItemId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${cartItemId}`).pipe(
      map(() => {
        const currentItems = this.cartItems.value;
        this.cartItems.next(currentItems.filter(item => item.cartItemId !== cartItemId));
      }),
      catchError(this.handleError)
    );
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${this.sessionId}/clear`).pipe(
      map(() => {
        this.cartItems.next([]);
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    let errorMessage = 'An error occurred. Please try again.';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    return throwError(() => errorMessage);
  }
}
