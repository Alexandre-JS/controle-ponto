# ✅ Sistema de Temas - Implementação Completa

## 🎉 SISTEMA TOTALMENTE IMPLEMENTADO E FUNCIONAL

O sistema completo de dark/light mode foi implementado com sucesso em todo o aplicativo Ionic/Angular usando os design systems fornecidos (light.json e dark.json).

### 🚀 **Status: 100% CONCLUÍDO**
- ✅ **Build de produção:** Compilado com sucesso
- ✅ **Integração completa:** Todas as páginas e componentes atualizados
- ✅ **Sistema robusto:** Theme service com persistência e detecção automática
- ✅ **Design consistente:** Classes utilitárias e variáveis CSS unificadas

---

## 🎨 Funcionalidades Implementadas

### 1. **Serviço de Temas** (`theme.service.ts`)
- ✅ Gerenciamento centralizado de temas
- ✅ Persistência da preferência do usuário no localStorage
- ✅ Detecção automática da preferência do sistema
- ✅ Aplicação dinâmica de variáveis CSS
- ✅ Design systems completos para light e dark mode

### 2. **Componente Toggle** (`theme-toggle.component`)
- ✅ Botão para alternar entre temas
- ✅ Ícones dinâmicos (sol/lua)
- ✅ Animações suaves
- ✅ Integração com o serviço de temas

### 3. **Variáveis CSS Customizadas Completas**

#### **Cores Base**
```scss
// Light Mode (padrão)
--app-background: #ffffff        // Background das páginas
--app-surface: #FFFFFF
--app-card: #FFFFFF
--app-divider: #E5E7EB
--app-border: #D1D5DB

// Dark Mode (aplicado via body.theme-dark)
--app-background: #383b47        // Background das páginas
--app-surface: #2A2B3A
--app-card: #323345
--app-divider: #404155
--app-border: #4B4C63
```

#### **Cores do Menu**
```scss
// Light Mode
--app-menu-background: #f6f8fa   // Background específico do menu
--app-menu-text-color: #1E1E2F
--app-menu-active-background: #EFF6FF
--app-menu-avatar-background: #FFFFFF

// Dark Mode
--app-menu-background: #3d3f4c   // Background específico do menu
--app-menu-text-color: #FFFFFF
--app-menu-active-background: #3A3B4E
--app-menu-avatar-background: #2A2B3A
```

#### **Cores Primárias e Acentos**
```scss
// Light Mode
--app-primary: #3B82F6
--app-primary-light: #60A5FA
--app-primary-dark: #2563EB
--app-accent: #FF5C93
--app-highlight: #8B5CF6
--app-success: #10B981
--app-warning: #F59E0B
--app-error: #EF4444

// Dark Mode
--app-primary: #5B68DF
--app-primary-light: #8B95E8
--app-primary-dark: #4C59D6
--app-accent: #FF5C93
--app-highlight: #AC8EFF
--app-success: #34D399
--app-warning: #FBBF24
--app-error: #F87171
```

#### **Tipografia**
```scss
// Light Mode
--app-text-primary: #1E1E2F
--app-text-secondary: #6B7280
--app-text-muted: #9CA3AF
--app-text-inverse: #FFFFFF

// Dark Mode
--app-text-primary: #FFFFFF
--app-text-secondary: #B0B3C9
--app-text-muted: #8B8FA8
--app-text-inverse: #1E1E2F
```

#### **Elevação e Sombras**
```scss
--app-shadow-light: 0 1px 3px rgba(0, 0, 0, 0.1)
--app-shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.1)
--app-shadow-large: 0 10px 15px rgba(0, 0, 0, 0.1)

// Dark mode shadows
body.theme-dark {
  --app-shadow-light: 0 1px 3px rgba(0, 0, 0, 0.3)
  --app-shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.3)
  --app-shadow-large: 0 10px 15px rgba(0, 0, 0, 0.3)
}
```

### 4. **Classes Utilitárias Completas**

#### **Layout e Cards**
- ✅ `.app-card` - Cards com tema adaptativo
- ✅ `.app-surface` - Superfícies com background temático
- ✅ `.app-container` - Containers com padding padrão

#### **Botões**
- ✅ `.app-button` - Botões primários com estilos do design system
- ✅ `.app-button-secondary` - Botões secundários
- ✅ `.app-button-ghost` - Botões fantasma/outlined
- ✅ `.app-button-danger` - Botões de ação perigosa

#### **Tipografia**
- ✅ `.text-heading` - Títulos principais
- ✅ `.text-subheading` - Subtítulos
- ✅ `.text-primary` - Texto primário
- ✅ `.text-secondary` - Texto secundário
- ✅ `.text-muted` - Texto com opacidade reduzida
- ✅ `.text-success`, `.text-warning`, `.text-error` - Textos de status

#### **Formulários**
- ✅ `.app-input` - Inputs com estilo temático
- ✅ `.app-select` - Selects estilizados
- ✅ `.app-textarea` - Text areas adaptativos
- ✅ `.form-group` - Grupos de formulário

#### **Estados e Feedback**
- ✅ `.loading-state` - Estados de carregamento
- ✅ `.error-state` - Estados de erro
- ✅ `.success-state` - Estados de sucesso
- ✅ `.empty-state` - Estados vazios

#### **Animações e Transições**
- ✅ `.theme-transition` - Transições suaves entre temas
- ✅ `.fade-in` - Animações de entrada
- ✅ `.slide-up` - Animações de deslizamento

### 5. **Componentes Ionic Customizados**
- ✅ ion-toolbar com cores do tema
- ✅ ion-content com background adaptativo
- ✅ ion-item com bordas e cores temáticas
- ✅ ion-modal com background do tema
- ✅ ion-toast, ion-alert adaptáveis

## 🚀 Páginas Atualizadas

### **Todas as Páginas Principais**
Todas as páginas do aplicativo foram atualizadas com o sistema de temas:

#### **Página de Login** (`login.page`)
- ✅ Header com toggle de tema
- ✅ Formulário com inputs temáticos
- ✅ Botões de login estilizados
- ✅ Background adaptativo
- ✅ Logo e elementos visuais responsivos

#### **Página Home** (`home.page`)
- ✅ Header com toggle e saudação
- ✅ Cards de navegação temáticos
- ✅ Ícones e textos adaptativos
- ✅ Layout responsivo

#### **Página de Funcionários** (`employee.page`)
- ✅ Header com toggle de tema
- ✅ Cards com design system
- ✅ Botões com estilos adaptativos
- ✅ Lista de funcionários responsiva
- ✅ Modal de cadastro temático

#### **Página de Presença Diária** (`daily-attendance.page`)
- ✅ Filtros e controles temáticos
- ✅ Lista de presenças com cards
- ✅ Indicadores de status coloridos
- ✅ Botões de ação estilizados

#### **Página de Relatórios** (`report.page`)
- ✅ Controles de filtro adaptativos
- ✅ Cards de estatísticas
- ✅ Botões de exportação
- ✅ Layout de dados responsivo

#### **Página de Presença** (`attendance.page`)
- ✅ Scanner QR com overlay temático
- ✅ Botões de registro estilizados
- ✅ Status e feedback visuais
- ✅ Interface de captura

#### **Página de Configurações** (`settings.page`)
- ✅ Opções de configuração temáticas
- ✅ Switches e controles adaptativos
- ✅ Cards de configuração
- ✅ Toggle de tema integrado

#### **Página Kiosk de Presença** (`attendance-kiosk.page`)
- ✅ Interface de tela cheia adaptativa
- ✅ Botões grandes e acessíveis
- ✅ Scanner integrado com tema
- ✅ Feedback visual otimizado

### **Componentes Atualizados**

#### **Modal de Funcionário** (`employee-form-modal`)
- ✅ Formulário com inputs temáticos
- ✅ Botões de ação estilizados
- ✅ Validação visual adaptativa
- ✅ Animações suaves

#### **Detalhes do Funcionário** (`employee-details`)
- ✅ Cards de informação temáticos
- ✅ Textos e labels adaptativos
- ✅ Botões de ação estilizados
- ✅ Layout responsivo

#### **Toggle de Tema** (`theme-toggle`)
- ✅ Ícones animados (sol/lua)
- ✅ Transições suaves
- ✅ Integração universal
- ✅ Feedback visual

#### **Menu Principal** (`app.component`)
- ✅ Background adaptativo por tema (light: #f6f8fa, dark: #3d3f4c)
- ✅ Textos e ícones adaptativos
- ✅ Estados hover e ativo temáticos
- ✅ Toggle de tema integrado no header
- ✅ Avatar e perfil com estilo adaptativo

## 📱 Recursos Visuais

### **Light Mode**
- Cores claras e profissionais
- Fundo: #F8F9FC
- Cartões: Branco com sombras suaves
- Texto: Tons escuros para boa legibilidade
- Primária: Azul #3B82F6

### **Dark Mode**
- Interface escura e moderna
- Fundo: #1E1F2B (dark navy)
- Cartões: #323345 com elevação
- Texto: Branco e tons claros
- Primária: Roxo-azul #5B68DF

## 🛠️ Como Usar - Guia Completo

### 1. **Integração Básica em Páginas**

#### Template HTML
```html
<ion-header>
  <ion-toolbar>
    <ion-title>Minha Página</ion-title>
    <ion-buttons slot="end">
      <app-theme-toggle></app-theme-toggle>
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content class="app-background">
  <div class="app-container">
    <div class="app-card">
      <h2 class="text-heading">Título do Card</h2>
      <p class="text-secondary">Descrição ou conteúdo</p>
      <ion-button class="app-button">Ação Principal</ion-button>
      <ion-button class="app-button-secondary">Ação Secundária</ion-button>
    </div>
  </div>
</ion-content>
```

#### Página TypeScript
```typescript
import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-minha-pagina',
  templateUrl: './minha-pagina.page.html',
  styleUrls: ['./minha-pagina.page.scss']
})
export class MinhaPaginaPage implements OnInit {
  currentTheme$ = this.themeService.currentTheme$;

  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    // O tema é aplicado automaticamente
    console.log('Tema atual:', this.themeService.getCurrentTheme());
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
```

#### SCSS da Página
```scss
.minha-pagina {
  // Use variáveis do tema
  .custom-section {
    background: var(--app-surface);
    border: 1px solid var(--app-divider);
    color: var(--app-text-primary);
    
    // Para estilos específicos do dark mode
    body.theme-dark & {
      box-shadow: var(--app-shadow-medium);
    }
  }
  
  // Aproveite as classes utilitárias
  .content-area {
    @extend .app-container;
  }
  
  .action-buttons {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }
}
```

### 2. **Componentes Customizados**

#### Template do Componente
```html
<div class="app-card custom-component">
  <div class="component-header">
    <h3 class="text-heading">{{ title }}</h3>
    <ion-icon [name]="icon" class="text-secondary"></ion-icon>
  </div>
  
  <div class="component-content">
    <p class="text-primary">{{ description }}</p>
  </div>
  
  <div class="component-actions">
    <ion-button 
      class="app-button"
      (click)="onPrimaryAction()">
      {{ primaryActionText }}
    </ion-button>
    
    <ion-button 
      fill="clear" 
      class="app-button-ghost"
      (click)="onSecondaryAction()">
      {{ secondaryActionText }}
    </ion-button>
  </div>
</div>
```

#### SCSS do Componente
```scss
.custom-component {
  .component-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--app-divider);
  }
  
  .component-content {
    margin-bottom: 20px;
    line-height: 1.5;
  }
  
  .component-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
  
  // Responsividade
  @media (max-width: 768px) {
    .component-actions {
      flex-direction: column;
      gap: 8px;
    }
  }
}
```

### 3. **Formulários Temáticos**

```html
<form class="app-form">
  <div class="form-group">
    <ion-label class="text-secondary">Nome</ion-label>
    <ion-input 
      class="app-input"
      placeholder="Digite o nome"
      [(ngModel)]="formData.name">
    </ion-input>
  </div>
  
  <div class="form-group">
    <ion-label class="text-secondary">Descrição</ion-label>
    <ion-textarea 
      class="app-textarea"
      placeholder="Digite a descrição"
      [(ngModel)]="formData.description">
    </ion-textarea>
  </div>
  
  <div class="form-actions">
    <ion-button 
      type="submit"
      class="app-button"
      [disabled]="!isFormValid">
      Salvar
    </ion-button>
    
    <ion-button 
      type="button"
      class="app-button-secondary"
      (click)="onCancel()">
      Cancelar
    </ion-button>
  </div>
</form>
```

### 4. **Listas e Cards**

```html
<div class="items-list">
  <div class="app-card" *ngFor="let item of items">
    <div class="item-header">
      <h4 class="text-heading">{{ item.title }}</h4>
      <span class="status-badge" [ngClass]="getStatusClass(item.status)">
        {{ item.status }}
      </span>
    </div>
    
    <p class="text-secondary">{{ item.description }}</p>
    
    <div class="item-meta">
      <span class="text-muted">{{ item.date | date:'short' }}</span>
      <ion-button 
        size="small"
        fill="clear"
        class="app-button-ghost">
        Ver Detalhes
      </ion-button>
    </div>
  </div>
</div>
```

### 5. **Estados de Loading e Erro**

```html
<!-- Loading State -->
<div class="loading-state" *ngIf="isLoading">
  <ion-spinner name="crescent"></ion-spinner>
  <p class="text-secondary">Carregando...</p>
</div>

<!-- Error State -->
<div class="error-state" *ngIf="hasError">
  <ion-icon name="alert-circle" class="text-error"></ion-icon>
  <h3 class="text-heading">Ops! Algo deu errado</h3>
  <p class="text-secondary">{{ errorMessage }}</p>
  <ion-button class="app-button" (click)="retry()">
    Tentar Novamente
  </ion-button>
</div>

<!-- Empty State -->
<div class="empty-state" *ngIf="isEmpty">
  <ion-icon name="folder-open" class="text-muted"></ion-icon>
  <h3 class="text-heading">Nenhum item encontrado</h3>
  <p class="text-secondary">Adicione alguns itens para começar</p>
  <ion-button class="app-button" (click)="addNew()">
    Adicionar Primeiro Item
  </ion-button>
</div>
```

### 7. **Estilizando Menus e Navegação**

```html
<ion-menu>
  <ion-header>
    <ion-toolbar>
      <ion-title>Menu</ion-title>
      <ion-buttons slot="end">
        <app-theme-toggle></app-theme-toggle>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  
  <div class="user-profile">
    <ion-avatar>
      <img src="avatar.jpg" alt="avatar">
    </ion-avatar>
    <h2>{{ userName }}</h2>
    <p>{{ userRole }}</p>
  </div>
  
  <ion-content>
    <ion-list>
      <ion-item 
        *ngFor="let item of menuItems"
        [routerLink]="item.url"
        routerLinkActive="selected">
        <ion-icon slot="start" [name]="item.icon"></ion-icon>
        <ion-label>{{ item.title }}</ion-label>
      </ion-item>
    </ion-list>
  </ion-content>
</ion-menu>
```

#### SCSS para Menu Temático
```scss
ion-menu {
  --background: var(--app-menu-background);
  --color: var(--app-menu-text-color);
  --border-color: var(--app-divider);
  
  ion-header ion-toolbar {
    --background: var(--app-menu-background);
    --color: var(--app-menu-text-color);
    
    ion-title {
      color: var(--app-menu-text-color);
    }
  }
  
  .user-profile {
    background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-accent) 100%);
    
    h2, p {
      color: white;
    }
  }
  
  ion-item {
    --background: transparent;
    --color: var(--app-menu-text-color);
    --background-hover: var(--app-menu-active-background);
    
    &.selected {
      --background: var(--app-menu-active-background);
      --color: var(--app-primary);
    }
  }
}
```

### 8. **Controlando Tema Programaticamente**

```typescript
export class MyComponent implements OnInit {
  constructor(private themeService: ThemeService) {}

  ngOnInit() {
    // Escutar mudanças de tema
    this.themeService.currentTheme$.subscribe(theme => {
      console.log('Tema mudou para:', theme);
      this.onThemeChanged(theme);
    });
  }

  // Métodos para controle de tema
  setLightTheme() {
    this.themeService.setTheme('light');
  }

  setDarkTheme() {
    this.themeService.setTheme('dark');
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.themeService.getCurrentTheme();
  }

  // Ações baseadas no tema
  onThemeChanged(theme: 'light' | 'dark') {
    if (theme === 'dark') {
      // Lógica específica para dark mode
      this.adjustDarkModeSettings();
    } else {
      // Lógica específica para light mode
      this.adjustLightModeSettings();
    }
  }
}
```

## 🎯 Benefícios

1. **Experiência do Usuário**
   - Tema escuro para ambientes com pouca luz
   - Tema claro para melhor legibilidade diurna
   - Transições suaves entre temas

2. **Acessibilidade**
   - Cores com contraste adequado
   - Suporte à preferência do sistema
   - Texto legível em ambos os temas

3. **Consistência**
   - Design system unificado
   - Variáveis centralizadas
   - Fácil manutenção

4. **Performance**
   - CSS Variables para mudanças instantâneas
   - Sem re-renderização desnecessária
   - Animações otimizadas

## 🔧 Personalização

Para adicionar novos componentes ao sistema de temas:

1. Use as variáveis CSS customizadas:
```scss
.meu-componente {
  background: var(--app-card);
  color: var(--app-text-primary);
  border: 1px solid var(--app-divider);
}
```

2. Adicione classes utilitárias:
```html
<div class="app-card text-primary">
  Conteúdo temático
</div>
```

3. Para estilos específicos do dark mode:
```scss
body.theme-dark .meu-componente {
  // Estilos específicos para dark mode
}
```

## 📋 Status de Implementação

### ✅ **CONCLUÍDO**
1. **Sistema Base**
   - ✅ ThemeService completo com persistência
   - ✅ ThemeToggleComponent universal
   - ✅ Variáveis CSS globais implementadas
   - ✅ Classes utilitárias criadas

2. **Todas as Páginas Principais**
   - ✅ Login Page
   - ✅ Home Page  
   - ✅ Employee Page
   - ✅ Daily Attendance Page
   - ✅ Report Page
   - ✅ Attendance Page
   - ✅ Settings Page
   - ✅ Attendance Kiosk Page

3. **Componentes Principais**
   - ✅ Employee Form Modal
   - ✅ Employee Details Component
   - ✅ Theme Toggle Component
   - ✅ Todos os componentes Ionic customizados

4. **Build e Testes**
   - ✅ Build de produção bem-sucedido
   - ✅ Verificação de erros TypeScript
   - ✅ Integração completa do sistema

### 🎯 **Próximos Passos Opcionais**

1. **Melhorias Avançadas**
   - Modo automático baseado no horário
   - Temas coloridos adicionais (azul, verde, roxo)
   - Animações mais elaboradas

2. **Acessibilidade**
   - Suporte a leitores de tela
   - Contraste aprimorado
   - Navegação por teclado

3. **Performance**
   - Lazy loading de temas
   - Otimização de CSS
   - Redução de bundle size

4. **Funcionalidades Extras**
   - Sincronização entre dispositivos
   - Preferências por usuário
   - Temas personalizados pelo usuário

## ⚠️ CORREÇÕES APLICADAS - Problema de Sobreposição CSS

### Problema Identificado
Havia regras CSS genéricas que estavam sobrescrevendo o background específico do menu, fazendo com que ele herdasse as cores das páginas em vez de usar suas cores específicas (`--app-menu-background`).

### Soluções Implementadas

#### 1. Regras CSS com Maior Especificidade
```scss
/* Aplicar background apenas para páginas principais */
ion-router-outlet ion-content {
  --background: var(--app-background);
}

/* Menu com especificidade extra */
ion-app ion-menu ion-content {
  --background: var(--app-menu-background) !important;
}

/* Forçar que nenhuma regra genérica sobrescreva o menu */
ion-menu * {
  --ion-background-color: var(--app-menu-background) !important;
}
```

#### 2. Correções no Dark Mode
```scss
body.theme-dark {
  /* Garantir que o menu mantenha sua cor específica no dark mode */
  ion-app ion-menu ion-content {
    --background: var(--app-menu-background) !important;
  }

  /* Garantir que nenhuma regra genérica sobrescreva o menu no dark mode */
  ion-menu * {
    --ion-background-color: var(--app-menu-background) !important;
  }
}
```

#### 3. Regras Aplicadas em Múltiplas Seções
As correções foram aplicadas consistentemente em:
- Seção principal do CSS (linhas ~878-890)
- Seção de dark mode (linhas ~1120-1135)
- Seção final do arquivo (linhas ~1340-1350)

### Resultado
- ✅ Menu agora mantém sua cor específica (`#f6f8fa` no light, `#3d3f4c` no dark)
- ✅ Páginas mantêm sua cor específica (`#ffffff` no light, `#383b47` no dark)
- ✅ Não há mais interferência entre as cores do menu e das páginas
- ✅ Funciona corretamente em ambos os modos (light/dark)

### Verificação
Execute `npm run build` para verificar que não há erros CSS e que a compilação é bem-sucedida.

---

## Melhorias de Contraste no Light Mode

Para garantir um bom contraste visual entre o background principal (`#ffffff`) e os componentes, implementamos as seguintes melhorias:

### Variáveis CSS Atualizadas

```scss
/* Light Mode */
--app-background: #ffffff;    /* Background principal */
--app-surface: #f6f8fa;       /* Superfícies e componentes */
--app-card: #f6f8fa;          /* Cards e containers */
```

### Componentes com Contraste Melhorado

Aplicamos o background `#f6f8fa` para vários componentes no modo claro:

```scss
/* Melhorando o contraste de elementos comuns */
ion-card,
ion-item,
ion-list,
.contrast-component {
  background-color: var(--app-surface) !important;
}
```

### Variáveis Globais do Ionic

```scss
:root {
  /* Componentes com melhor contraste no light mode */
  --ion-item-background: var(--app-surface);
  --ion-toolbar-background: var(--app-surface);
  --ion-tab-bar-background: var(--app-surface);
}
```

### Condicionais para Media Queries

```scss
/* Modo claro - garantir contraste entre background (#ffffff) e componentes (#f6f8fa) */
@media (prefers-color-scheme: light) {
  .form-item,
  ion-searchbar,
  ion-select,
  ion-datetime,
  ion-segment {
    background-color: var(--app-surface) !important;
  }
}
```

Estas melhorias garantem que no modo claro os componentes sejam visualmente distinguíveis do background principal, mantendo uma experiência visual agradável e coerente.

---

## Aprimoramentos na Consistência Visual - Light Mode

### Padronização de Background para Componentes

Para garantir uma experiência visual consistente e com melhor contraste no modo claro, todos os componentes da aplicação agora utilizam rigorosamente o background `#f6f8fa`. Esta atualização:

1. **Aumenta o contraste** entre o background principal (`#ffffff`) e os componentes
2. **Uniformiza a aparência** de todos os elementos de interface
3. **Reduz a fadiga visual** causada por superfícies totalmente brancas
4. **Melhora a legibilidade** de conteúdos em elementos de interface

### Implementação

Novos seletores CSS globais foram adicionados para garantir que todos os componentes em modo claro usem o background correto:

```scss
/* Aplicar background padrão para componentes em light mode */
body:not(.theme-dark) {
  /* Componentes comuns */
  ion-card, ion-list, ion-item-group, ion-item-divider, ion-grid {
    --background: var(--app-surface) !important;
    background-color: var(--app-surface) !important;
  }

  /* Componentes específicos */
  .app-card, .welcome-card, .stat-card, .attendance-card,
  .dashboard-card, .profile-card, .settings-card {
    --background: var(--app-surface) !important;
    background-color: var(--app-surface) !important;
  }

  /* Formulários e inputs */
  ion-input, ion-textarea, ion-select, ion-datetime, ion-searchbar {
    --background: var(--app-surface) !important;
    background-color: var(--app-surface) !important;
  }
}
```

### Sobrescritas CSS

Para evitar que regras genéricas interfiram com este padrão, implementamos:

1. **Alta especificidade de seletores** - Usando combinações de seletores para aumentar a prioridade
2. **Flags `!important`** - Aplicadas às propriedades críticas para garantir que não sejam sobrescritas
3. **Seletores específicos** - Regras direcionadas a cada tipo de componente individualmente

### Verificação

Se você encontrar algum componente que não está seguindo este padrão no light mode (background diferente de `#f6f8fa`), por favor:

1. Inspecione o elemento usando as ferramentas de desenvolvedor
2. Verifique se há alguma regra CSS sobrescrevendo o padrão
3. Adicione um seletor mais específico ou uma classe personalizada para corrigir

### Manter a Consistência

Ao criar novos componentes, sempre use as variáveis CSS:
```scss
.novo-componente {
  background-color: var(--app-surface); /* Não use valores hexadecimais diretamente */
  color: var(--app-text-primary);
}
```
