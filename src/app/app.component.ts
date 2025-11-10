import { Component, ViewChild, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild(SidebarComponent) sidebar!: SidebarComponent;
  showLayout = false;
  showSidebar = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Ocultar layout en la página de login
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.showLayout = event.url !== '/login';
      
      // Si no está autenticado y no está en login, redirigir
      if (!this.authService.isAuthenticated() && event.url !== '/login') {
        this.router.navigate(['/login']);
      }
      
      // Actualizar visibilidad del sidebar según el rol
      this.updateSidebarVisibility();
    });
    
    // Suscribirse a cambios en el usuario para actualizar la visibilidad del sidebar
    this.authService.currentUser$.subscribe(() => {
      this.updateSidebarVisibility();
    });
  }
  
  updateSidebarVisibility(): void {
    // Solo mostrar sidebar para administradores
    this.showSidebar = this.authService.isAdmin();
  }

  onMenuToggle(): void {
    if (this.sidebar) {
      this.sidebar.toggle();
    }
  }
}

