import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { TiposComponent } from './tipos.component';
import { TipoDialogComponent } from './tipo-dialog/tipo-dialog.component';

const routes: Routes = [
  { path: '', component: TiposComponent }
];

@NgModule({
  declarations: [
    TiposComponent,
    TipoDialogComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class TiposModule { }

