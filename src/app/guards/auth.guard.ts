import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.isAuthenticated().pipe(
      take(1),
      map(isAuth => {
        if (!isAuth) {
          console.log('User not authenticated, redirecting to login');
          this.router.navigate(['/login'], { 
            replaceUrl: true,
            queryParams: { returnUrl: state.url }
          });
          return false;
        }
        return true;
      }),
      catchError(error => {
        console.error('Auth guard error:', error);
        this.router.navigate(['/login'], { replaceUrl: true });
        return of(false);
      })
    );
  }
}
