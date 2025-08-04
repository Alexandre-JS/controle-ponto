import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { ThemeToggleComponent } from '../components/theme-toggle/theme-toggle.component';
import { AppHeaderComponent } from '../components/app-header/app-header.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, ThemeToggleComponent, AppHeaderComponent]
})
export class HomePage {

  constructor() {}

}
