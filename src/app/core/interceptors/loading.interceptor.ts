import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

/**
 * Interceptor que gestiona el estado de carga global
 * Muestra/oculta el spinner durante las peticiones HTTP
 */
@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  constructor(private loadingService: LoadingService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Iniciar carga
    this.loadingService.show();

    return next.handle(req).pipe(
      finalize(() => {
        // Finalizar carga
        this.loadingService.hide();
      })
    );
  }
}

