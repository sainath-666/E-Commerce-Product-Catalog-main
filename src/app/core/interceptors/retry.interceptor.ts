import {
  HttpEvent,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

export function retryInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  return next(request).pipe(
    retry(3),
    catchError((error: HttpErrorResponse) => {
      console.error('API Error:', error);
      return throwError(() => error);
    })
  );
}
