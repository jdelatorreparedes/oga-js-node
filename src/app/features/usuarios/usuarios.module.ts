import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { UsuariosComponent } from './usuarios.component';
import { UsuarioDialogComponent } from './usuario-dialog/usuario-dialog.component';
import { AdminGuard } from '../../core/guards/admin.guard';

const routes: Routes = [
  { 
    path: '', 
    component: UsuariosComponent,
    canActivate: [AdminGuard]
  }
];

@NgModule({
  declarations: [
    UsuariosComponent,
    UsuarioDialogComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class UsuariosModule { }

