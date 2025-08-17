import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
import { Category } from '../models/category.model';
import { ApiConfigService } from './api-config.service';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl: string;

  constructor(private http: HttpClient, private apiConfig: ApiConfigService) {
    this.apiUrl = this.apiConfig.getApiUrl('Categories');
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    if (error.error instanceof ErrorEvent) {
      console.error('Client-side error:', error.error.message);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`
      );
    }
    return throwError(
      () => new Error('Unable to contact the server. Please try again later.')
    );
  }

  getCategories(): Observable<Category[]> {
    console.log('Fetching categories from:', this.apiUrl);
    return this.http.get<any>(this.apiUrl).pipe(
      retry(3),
      map((response) => {
        console.log('Raw category response:', response);
        console.log('Response type:', typeof response);
        console.log('Response structure:', Object.keys(response));

        if (response.data?.data) {
          return response.data.data;
        } else if (Array.isArray(response.data)) {
          return response.data;
        } else if (Array.isArray(response)) {
          return response;
        }
        console.error('Invalid category response format:', response);
        return [];
      }),
      catchError((error) => {
        console.error('Error fetching categories:', error);
        console.error('Error details:', {
          status: error.status,
          message: error.message,
          error: error.error,
        });
        return throwError(
          () => new Error('Failed to fetch categories. Please try again.')
        );
      })
    );
  }

  getCategory(id: number): Observable<Category> {
    return this.http
      .get<Category>(`${this.apiUrl}/${id}`)
      .pipe(retry(3), catchError(this.handleError));
  }

  getCategoryHierarchy(): Observable<Category[]> {
    return this.http
      .get<{
        success: boolean;
        message: string;
        data: { data: Category[] };
        errors: any[];
      }>(`${this.apiUrl}/hierarchy`)
      .pipe(
        map((response) => {
          console.log('Category Hierarchy Response:', response);
          return response.data.data;
        }),
        catchError(this.handleError)
      );
  }
}
