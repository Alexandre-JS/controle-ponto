import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { EmployeePage } from './employee.page';
import { SuccessModalComponent } from '../../components/success-modal/success-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    SuccessModalComponent,  // Add to imports instead of declarations
    RouterModule.forChild([
      {
        path: '',
        component: EmployeePage
      }
    ])
  ],
  declarations: [], // Remove SuccessModalComponent from here
  exports: []      // Remove SuccessModalComponent from here
})
export class EmployeePageModule {}