import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
  },
//   {
//     path: 'home',
//     loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage)
//   },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: 'report',
    loadComponent: () => import('./pages/report/report.page').then(m => m.ReportPage)
  },
  {
    path: 'employee',
    loadComponent: () => import('./pages/employee/employee.page').then(m => m.EmployeePage)
  },
  {
    path: 'attendance',
    loadComponent: () => import('./pages/attendance/attendance.page').then(m => m.AttendancePage)
  },
  {
    path: 'attendance-kiosk',
    loadComponent: () => import('./pages/attendance-kiosk/attendance-kiosk.page').then(m => m.AttendanceKioskPage)
  },
  {
    path: 'daily-attendance',
    loadComponent: () => import('./pages/daily-attendance/daily-attendance.page').then(m => m.DailyAttendancePageComponent)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule]
})
export class AppRoutingModule { }