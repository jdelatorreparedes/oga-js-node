import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { PaginatorIntlService } from './shared/services/paginator-intl.service';
import { AuthGuard } from './core/guards/auth.guard';

// Lazy loading de módulos de feature
const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { 
    path: 'login', 
    loadChildren: () => import('./features/login/login.module').then(m => m.LoginModule)
  },
  { 
    path: 'dashboard', 
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'tipos', 
    loadChildren: () => import('./features/tipos/tipos.module').then(m => m.TiposModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'activos', 
    loadChildren: () => import('./features/activos/activos.module').then(m => m.ActivosModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'historico', 
    loadChildren: () => import('./features/historico/historico.module').then(m => m.HistoricoModule),
    canActivate: [AuthGuard]
  },
  { 
    path: 'usuarios', 
    loadChildren: () => import('./features/usuarios/usuarios.module').then(m => m.UsuariosModule)
  }
];

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    { provide: MatPaginatorIntl, useClass: PaginatorIntlService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

