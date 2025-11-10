import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { Usuario } from '../../../models/usuario.model';
import { ChangePasswordDialogComponent } from '../change-password-dialog/change-password-dialog.component';

/**
 * Componente de barra superior (topbar)
 * Muestra información del usuario y acciones globales
 */
@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();

  menuItems: any[] = [];
  currentUser: Usuario | null = null;
  showMenuButton = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.updateMenuItems();
    this.updateMenuButtonVisibility();
    this.authService.currentUser$.subscribe((user: Usuario | null) => {
      this.currentUser = user;
      this.updateMenuItems();
      this.updateMenuButtonVisibility();
    });
  }
  
  updateMenuButtonVisibility(): void {
    // Solo mostrar el botón de menú si el usuario es administrador (tiene sidebar)
    this.showMenuButton = this.authService.isAdmin();
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

  onMenuToggle(): void {
    this.menuToggle.emit();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  openChangePasswordDialog(): void {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // La contraseña se cambió correctamente
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

