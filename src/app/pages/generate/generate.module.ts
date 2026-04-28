import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { TokenGuard } from '../../guards/token.guard';
import { SharedModule } from '../../shared/shared.module';
import { GenerateComponent } from './generate.component';

const routes: Routes = [
  {
    path: '',
    component: GenerateComponent,
    canActivate: [TokenGuard],
  },
];

@NgModule({
  declarations: [GenerateComponent],
  imports: [
    SharedModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
})
export class GenerateModule {}
