import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Componente de barra lateral (sidebar)
 * Navegación principal de la aplicación con diseño corporativo
 */
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  isCollapsed = true;
  menuItems: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.updateMenuItems();
    this.authService.currentUser$.subscribe(() => {
      this.updateMenuItems();
    });
  }

  updateMenuItems(): void {
    this.menuItems = [
      { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
      { icon: 'category', label: 'Tipos', route: '/tipos' },
      { icon: 'inventory', label: 'Activos', route: '/activos' },
      { icon: 'history', label: 'Histórico', route: '/historico' }
    ];

    // Solo administradores pueden ver la gestión de usuarios
    if (this.authService.canManageUsers()) {
      this.menuItems.push({ icon: 'people', label: 'Usuarios', route: '/usuarios' });
    }
  }

  toggle(): void {
    this.isCollapsed = !this.isCollapsed;
    this.toggleSidebar.emit();
  }
}

