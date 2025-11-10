import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { HistoricoComponent } from './historico.component';

const routes: Routes = [
  { path: '', component: HistoricoComponent }
];

@NgModule({
  declarations: [
    HistoricoComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class HistoricoModule { }

