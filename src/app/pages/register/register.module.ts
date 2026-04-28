import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../../shared/shared.module';
import { RegisterComponent } from './register.component';

const routes: Routes = [
  {
    path: '',
    component: RegisterComponent,
  },
];

@NgModule({
  declarations: [RegisterComponent],
  imports: [
    SharedModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
})
export class RegisterModule {}
