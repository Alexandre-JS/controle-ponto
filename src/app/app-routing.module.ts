import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { PublicGuard } from './guards/public.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
    canActivate: [PublicGuard]
  },
  {
    path: 'kiosk',
    loadComponent: () => import('./pages/attendance-kiosk/attendance-kiosk.page')
      .then(m => m.AttendanceKioskPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'daily-attendance',
        pathMatch: 'full'
      },
      {
        path: 'daily-attendance',
        loadComponent: () => import('./pages/daily-attendance/daily-attendance.page')
          .then(m => m.DailyAttendancePageComponent),
        canActivate: [AuthGuard] // Adicionar o guard aqui
      },
      {
        path: 'attendance',
        loadChildren: () => import('./pages/attendance/attendance.module')
          .then(m => m.AttendancePageModule),
        canActivate: [AuthGuard]
      },
      {
        path: 'employee',
        loadChildren: () => import('./pages/employee/employee.module')
          .then(m => m.EmployeePageModule)
      },
      {
        path: 'report',
        loadChildren: () => import('./pages/report/report.module')
          .then(m => m.ReportPageModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('./pages/settings/settings.module')
          .then(m => m.SettingsPageModule)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'  // Redireciona para login em caso de rota inválida
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
