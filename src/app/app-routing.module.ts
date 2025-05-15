import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'kiosk',
    pathMatch: 'full'
  },
  
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    children: [
      {
        path: 'attendance',
        loadChildren: () => import('./pages/attendance/attendance.module').then(m => m.AttendancePageModule)
      },
      {
        path: 'kiosk',
        loadComponent: () => import('./pages/attendance-kiosk/attendance-kiosk.page')
          .then(m => m.AttendanceKioskPage)
      },
      {
        path: 'employee',
        loadChildren: () => import('./pages/employee/employee.module').then(m => m.EmployeePageModule)
      },
      {
        path: 'report',
        loadChildren: () => import('./pages/report/report.module').then(m => m.ReportPageModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('./pages/settings/settings.module').then(m => m.SettingsPageModule)
      }
    ]
  }
];
