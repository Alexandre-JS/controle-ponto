// Este arquivo é mantido apenas por compatibilidade histórica
// A aplicação usa componentes standalone e bootstrapApplication
// Veja src/main.ts para a configuração principal do bootstrap

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';

// Importar serviços principais
import { NetworkService } from './services/network.service';
import { LocalStorageService } from './services/local-storage.service';
import { SyncService } from './services/sync.service';
import { CacheService } from './services/cache.service';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
/**
 * NOTA IMPORTANTE: Esta aplicação usa a arquitetura Angular standalone e bootstrapApplication
 *
 * Este módulo é mantido apenas para compatibilidade com código legado que ainda
 * possa depender do sistema NgModule. Componentes novos devem ser criados como standalone.
 *
 * Os serviços principais são fornecidos tanto aqui quanto em main.ts para garantir
 * que estejam disponíveis em toda a aplicação, independente de como os componentes
 * são carregados.
 *
 * NÃO adicione componentes standalone às declarations ou imports do NgModule,
 * pois isso pode causar erros de duplicação.
 */
@NgModule({
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    NetworkService,
    LocalStorageService,
    SyncService,
    CacheService,
    BarcodeScanner
  ]
})
export class AppModule {}
