import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { RouteReuseStrategy } from '@angular/router';
import { AppRoutingModule } from './app/app-routing.module';
import { HttpClientModule } from '@angular/common/http';

// Importar serviços principais
import { NetworkService } from './app/services/network.service';
import { LocalStorageService } from './app/services/local-storage.service';
import { SyncService } from './app/services/sync.service';
import { CacheService } from './app/services/cache.service';

bootstrapApplication(AppComponent, {
  providers: [
    // Estratégia de reuso de rotas do Ionic
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    
    // Módulos importados
    importProvidersFrom(IonicModule.forRoot()),
    importProvidersFrom(AppRoutingModule),
    importProvidersFrom(HttpClientModule),
    
    // Serviços principais da aplicação
    NetworkService,
    LocalStorageService,
    SyncService,
    CacheService
  ]
}).catch(err => console.error('Error bootstrapping app:', err));
