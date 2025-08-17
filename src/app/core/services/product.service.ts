import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, retry } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private apiUrl: string;

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {
    this.apiUrl = this.apiConfig.getApiUrl('Products');
  }

  getProducts(
    pageNumber: number = 1,
    pageSize: number = 10,
    categoryId?: number,
    ascending: boolean = true,
    searchQuery?: string
  ): Observable<{ items: Product[]; totalCount: number }> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber.toString())
      .set('pageSize', pageSize.toString())
      .set('sortBy', 'ProductName')
      .set('sortOrder', ascending ? 'ASC' : 'DESC');

    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }

    if (searchQuery && searchQuery.trim()) {
      params = params.set('search', searchQuery.trim());
    }

    console.log('Fetching products with URL:', this.apiUrl);
    console.log('Request parameters:', params.toString());

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        console.log('Raw API Response:', response);
        console.log('Response type:', typeof response);

        // Handle direct array response
        let products;
        if (Array.isArray(response)) {
          products = response;
        } else if (response.data && Array.isArray(response.data)) {
          products = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          products = response.data.data;
        } else {
          console.error('Invalid response structure:', response);
          throw new Error('Invalid response format');
        }

        // Add default image URL if none provided
        products = products.map((product: Product) => {
          let fullImageUrl = product.imageUrl;
          if (fullImageUrl) {
            if (!fullImageUrl.startsWith('http')) {
              // Remove /api from the base URL for images
              const baseUrl = this.apiConfig.getBaseUrl();
              // Ensure the path starts with /uploads/
              fullImageUrl = fullImageUrl.startsWith('/')
                ? fullImageUrl
                : `/uploads/${fullImageUrl}`;
              fullImageUrl = `${baseUrl}${fullImageUrl}`;
            }
          }
          // For debugging
          console.log('Product image URL:', {
            original: product.imageUrl,
            processed: fullImageUrl,
          });
          return {
            ...product,
            imageUrl: fullImageUrl,
          };
        });

        console.log('Processed products:', products);

        return {
          items: products,
          totalCount: response.totalRecords || products.length || 0,
        };
      }),
      retry(3),
      catchError(this.handleError)
    );
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((response) => {
        // Handle both formats: { data: {...} } or just {...}
        const productData = response.data ? response.data : response;
        if (!productData || typeof productData !== 'object') {
          throw new Error('Invalid response format');
        }
        return {
          ...productData,
          imageUrl: productData.imageUrl,
        };
      }),
      retry(3),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    let errorMessage = 'An error occurred while fetching products.';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => errorMessage);
  }

  getSearchSuggestions(query: string): Observable<string[]> {
    if (!query || query.length < 2) {
      return new Observable<string[]>((subscriber) => subscriber.next([]));
    }

    return this.getProducts(1, 5, undefined, true, query).pipe(
      map((response) => {
        // Map product names and filter by query to ensure relevance
        return response.items
          .map((product) => product.productName)
          .filter((name) => name.toLowerCase().includes(query.toLowerCase()));
      }),
      catchError((error) => {
        console.error('Error getting search suggestions:', error);
        return new Observable<string[]>((subscriber) => subscriber.next([]));
      })
    );
  }
}
