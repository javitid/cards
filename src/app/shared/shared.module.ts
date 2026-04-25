import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { PasswordModule } from 'primeng/password';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { HelperService } from '../utils/helper.service';
import { UtilsService } from '../utils/utils.service';

const UI = [
  CommonModule,
  FormsModule,
  ButtonModule,
  CardModule,
  DialogModule,
  FloatLabelModule,
  InputTextModule,
  MessageModule,
  PasswordModule,
  ProgressBarModule,
  ProgressSpinnerModule,
  SelectModule,
  TextareaModule,
  ToastModule,
  ToolbarModule,
  TooltipModule,
];

@NgModule({
  exports: [UI],
  imports: [UI],
  providers: [
    HelperService,
    UtilsService,
    MessageService,
  ],
})
export class SharedModule {}
