import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ActivosComponent } from './activos.component';
import { ActivoDialogComponent } from './activo-dialog/activo-dialog.component';
import { AsignarDialogComponent } from './asignar-dialog/asignar-dialog.component';
import { BajaDialogComponent } from './baja-dialog/baja-dialog.component';

const routes: Routes = [
  { path: '', component: ActivosComponent }
];

@NgModule({
  declarations: [
    ActivosComponent,
    ActivoDialogComponent,
    AsignarDialogComponent,
    BajaDialogComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class ActivosModule { }

