import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, ThemeToggleComponent]
})
export class AppHeaderComponent {
  @Input() title: string = 'Dashboard';
  @Input() icon: string = 'speedometer-outline';
  @Input() showNotifications: boolean = true;
  @Input() showMenu: boolean = true;
  @Input() showThemeToggle: boolean = true;
}
