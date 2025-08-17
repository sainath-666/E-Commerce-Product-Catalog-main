import {
  HttpEvent,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { Observable } from 'rxjs';

export function httpsInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> {
  // Keep HTTPS for all requests
  return next(request);
}
