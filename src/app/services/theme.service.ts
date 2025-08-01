import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DesignSystem {
  name: string;
  theme: {
    mode: 'light' | 'dark';
    background: string;
    surface: string;
    card: string;
    primary: string;
    accent: string;
    highlight: string;
    textPrimary: string;
    textSecondary: string;
    divider: string;
    elevation: {
      level1: string;
      level2: string;
    };
  };
  typography: {
    fontFamily: string;
    heading: {
      h1: { size: string; weight: string };
      h2: { size: string; weight: string };
      h3: { size: string; weight: string };
    };
    body: {
      default: { size: string; weight: string };
      caption: { size: string; weight: string };
    };
    color: {
      heading: string;
      body: string;
    };
  };
  layout: {
    sidebar: {
      width: string;
      background: string;
      textColor: string;
      activeItem: {
        background: string;
        textColor?: string;
        borderRadius: string;
      };
      borderRight?: string;
    };
    topbar: {
      height: string;
      background: string;
      avatarSize: string;
      iconColor: string;
    };
    contentPadding: string;
    cardRadius: string;
  };
  components: {
    statsCard: {
      type: string;
      trackColor: string;
      barColor: string;
      text: {
        valueSize: string;
        labelSize: string;
      };
      layout: string;
    };
    lineChart: {
      background: string;
      lineColor: string;
      hoverPoint: {
        color: string;
        radius: string;
        tooltipBackground: string;
        tooltipTextColor: string;
      };
      gridLines: boolean;
    };
    navigation: {
      itemSpacing: string;
      iconSize: string;
      textSize: string;
      hoverEffect: any;
    };
  };
  interactions: {
    hover: {
      sidebarItem: {
        background: string;
        textColor: string;
      };
      card: {
        shadow: string;
      };
    };
    focus: {
      ringColor: string;
      ringWidth: string;
    };
    selected: {
      accentColor: string;
    };
  };
  responsive: {
    breakpoints: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    scaling: {
      font: string;
      padding: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private currentThemeSubject = new BehaviorSubject<'light' | 'dark'>('light');
  public currentTheme$ = this.currentThemeSubject.asObservable();

  private lightDesignSystem: DesignSystem = {
    "name": "LightDashboardUI",
    "theme": {
      "mode": "light",
      "background": "#F8F9FC",
      "surface": "#FFFFFF",
      "card": "#FFFFFF",
      "primary": "#3B82F6",
      "accent": "#FF5C93",
      "highlight": "#8B5CF6",
      "textPrimary": "#1E1E2F",
      "textSecondary": "#6B7280",
      "divider": "#E5E7EB",
      "elevation": {
        "level1": "0px 2px 8px rgba(0, 0, 0, 0.05)",
        "level2": "0px 4px 12px rgba(0, 0, 0, 0.1)"
      }
    },
    "typography": {
      "fontFamily": "Inter, sans-serif",
      "heading": {
        "h1": { "size": "24px", "weight": "600" },
        "h2": { "size": "20px", "weight": "500" },
        "h3": { "size": "18px", "weight": "500" }
      },
      "body": {
        "default": { "size": "14px", "weight": "400" },
        "caption": { "size": "12px", "weight": "400" }
      },
      "color": {
        "heading": "#111827",
        "body": "#6B7280"
      }
    },
    "layout": {
      "sidebar": {
        "width": "240px",
        "background": "#FFFFFF",
        "textColor": "#1E1E2F",
        "activeItem": {
          "background": "#EFF6FF",
          "textColor": "#3B82F6",
          "borderRadius": "8px"
        },
        "borderRight": "1px solid #E5E7EB"
      },
      "topbar": {
        "height": "64px",
        "background": "#FFFFFF",
        "avatarSize": "32px",
        "iconColor": "#3B82F6"
      },
      "contentPadding": "24px",
      "cardRadius": "12px"
    },
    "components": {
      "statsCard": {
        "type": "circularProgress",
        "trackColor": "#E5E7EB",
        "barColor": "#FF5C93",
        "text": {
          "valueSize": "24px",
          "labelSize": "12px"
        },
        "layout": "horizontal"
      },
      "lineChart": {
        "background": "#FFFFFF",
        "lineColor": "#3B82F6",
        "hoverPoint": {
          "color": "#FFFFFF",
          "radius": "6px",
          "tooltipBackground": "#3B82F6",
          "tooltipTextColor": "#FFFFFF"
        },
        "gridLines": true
      },
      "navigation": {
        "itemSpacing": "16px",
        "iconSize": "20px",
        "textSize": "14px",
        "hoverEffect": {
          "background": "#EFF6FF",
          "textColor": "#3B82F6"
        }
      }
    },
    "interactions": {
      "hover": {
        "sidebarItem": {
          "background": "#EFF6FF",
          "textColor": "#3B82F6"
        },
        "card": {
          "shadow": "0px 4px 12px rgba(0, 0, 0, 0.08)"
        }
      },
      "focus": {
        "ringColor": "#3B82F6",
        "ringWidth": "2px"
      },
      "selected": {
        "accentColor": "#8B5CF6"
      }
    },
    "responsive": {
      "breakpoints": {
        "sm": "480px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px"
      },
      "scaling": {
        "font": "clamp(12px, 2vw, 16px)",
        "padding": "clamp(12px, 3vw, 24px)"
      }
    }
  };

  private darkDesignSystem: DesignSystem = {
    "name": "DarkDashboardUI",
    "theme": {
      "mode": "dark",
      "background": "#1E1F2B",
      "surface": "#2A2B3A",
      "card": "#323345",
      "primary": "#5B68DF",
      "accent": "#FF5C93",
      "highlight": "#AC8EFF",
      "textPrimary": "#FFFFFF",
      "textSecondary": "#B0B3C9",
      "divider": "#3A3B4E",
      "elevation": {
        "level1": "0px 4px 8px rgba(0, 0, 0, 0.3)",
        "level2": "0px 6px 12px rgba(0, 0, 0, 0.35)"
      }
    },
    "typography": {
      "fontFamily": "Inter, sans-serif",
      "heading": {
        "h1": { "size": "24px", "weight": "600" },
        "h2": { "size": "20px", "weight": "500" },
        "h3": { "size": "18px", "weight": "500" }
      },
      "body": {
        "default": { "size": "14px", "weight": "400" },
        "caption": { "size": "12px", "weight": "400" }
      },
      "color": {
        "heading": "#FFFFFF",
        "body": "#B0B3C9"
      }
    },
    "layout": {
      "sidebar": {
        "width": "240px",
        "background": "#2A2B3A",
        "textColor": "#FFFFFF",
        "activeItem": {
          "background": "#3A3B4E",
          "borderRadius": "8px"
        }
      },
      "topbar": {
        "height": "64px",
        "background": "#1E1F2B",
        "avatarSize": "32px",
        "iconColor": "#FFFFFF"
      },
      "contentPadding": "24px",
      "cardRadius": "12px"
    },
    "components": {
      "statsCard": {
        "type": "circularProgress",
        "trackColor": "#3A3B4E",
        "barColor": "#FF5C93",
        "text": {
          "valueSize": "24px",
          "labelSize": "12px"
        },
        "layout": "horizontal"
      },
      "lineChart": {
        "background": "#2A2B3A",
        "lineColor": "#5B68DF",
        "hoverPoint": {
          "color": "#FFFFFF",
          "radius": "6px",
          "tooltipBackground": "#5B68DF",
          "tooltipTextColor": "#FFFFFF"
        },
        "gridLines": false
      },
      "navigation": {
        "itemSpacing": "16px",
        "iconSize": "20px",
        "textSize": "14px",
        "hoverEffect": "color + background change"
      }
    },
    "interactions": {
      "hover": {
        "sidebarItem": {
          "background": "#3A3B4E",
          "textColor": "#FFFFFF"
        },
        "card": {
          "shadow": "0px 6px 12px rgba(0,0,0,0.3)"
        }
      },
      "focus": {
        "ringColor": "#5B68DF",
        "ringWidth": "2px"
      },
      "selected": {
        "accentColor": "#AC8EFF"
      }
    },
    "responsive": {
      "breakpoints": {
        "sm": "480px",
        "md": "768px",
        "lg": "1024px",
        "xl": "1280px"
      },
      "scaling": {
        "font": "clamp(12px, 2vw, 16px)",
        "padding": "clamp(12px, 3vw, 24px)"
      }
    }
  };

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem('app-theme') as 'light' | 'dark';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.setTheme(initialTheme);
  }

  setTheme(theme: 'light' | 'dark') {
    this.currentThemeSubject.next(theme);
    localStorage.setItem('app-theme', theme);

    // Aplicar o tema ao DOM
    this.applyTheme(theme);
  }

  toggleTheme() {
    const currentTheme = this.currentThemeSubject.value;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  getCurrentTheme(): 'light' | 'dark' {
    return this.currentThemeSubject.value;
  }

  getCurrentDesignSystem(): DesignSystem {
    return this.currentThemeSubject.value === 'light'
      ? this.lightDesignSystem
      : this.darkDesignSystem;
  }

  private applyTheme(theme: 'light' | 'dark') {
    const designSystem = theme === 'light' ? this.lightDesignSystem : this.darkDesignSystem;
    const root = document.documentElement;

    // Aplicar variáveis CSS customizadas
    root.style.setProperty('--app-background', designSystem.theme.background);
    root.style.setProperty('--app-surface', theme === 'light' ? '#f6f8fa' : designSystem.theme.surface);
    root.style.setProperty('--app-card', theme === 'light' ? '#f6f8fa' : designSystem.theme.card);
    root.style.setProperty('--app-primary', designSystem.theme.primary);
    root.style.setProperty('--app-accent', designSystem.theme.accent);
    root.style.setProperty('--app-highlight', designSystem.theme.highlight);
    root.style.setProperty('--app-text-primary', designSystem.theme.textPrimary);
    root.style.setProperty('--app-text-secondary', designSystem.theme.textSecondary);
    root.style.setProperty('--app-divider', designSystem.theme.divider);
    root.style.setProperty('--app-elevation-level1', designSystem.theme.elevation.level1);
    root.style.setProperty('--app-elevation-level2', designSystem.theme.elevation.level2);

    // Aplicar variáveis de layout
    root.style.setProperty('--app-sidebar-background', designSystem.layout.sidebar.background);
    root.style.setProperty('--app-sidebar-text-color', designSystem.layout.sidebar.textColor);
    root.style.setProperty('--app-sidebar-active-background', designSystem.layout.sidebar.activeItem.background);
    root.style.setProperty('--app-topbar-background', designSystem.layout.topbar.background);
    root.style.setProperty('--app-topbar-icon-color', designSystem.layout.topbar.iconColor);
    root.style.setProperty('--app-card-radius', designSystem.layout.cardRadius);

    // Aplicar variáveis do menu e páginas com cores distintas
    const pageBackground = theme === 'light' ? '#ffffff' : '#383b47';
    const menuBackground = theme === 'light' ? '#f6f8fa' : '#3d3f4c';
    const menuTextColor = theme === 'light' ? '#1E1E2F' : '#FFFFFF';
    const menuActiveBackground = theme === 'light' ? '#EFF6FF' : '#3A3B4E';
    const menuAvatarBackground = theme === 'light' ? '#FFFFFF' : '#2A2B3A';

    // Aplicar background das páginas
    root.style.setProperty('--app-background', pageBackground);

    // Aplicar variáveis do menu
    root.style.setProperty('--app-menu-background', menuBackground);
    root.style.setProperty('--app-menu-text-color', menuTextColor);
    root.style.setProperty('--app-menu-active-background', menuActiveBackground);
    root.style.setProperty('--app-menu-avatar-background', menuAvatarBackground);

    // Aplicar variáveis de tipografia
    root.style.setProperty('--app-font-family', designSystem.typography.fontFamily);
    root.style.setProperty('--app-heading-color', designSystem.typography.color.heading);
    root.style.setProperty('--app-body-color', designSystem.typography.color.body);

    // Adicionar/remover classe do tema no body
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);

    // Aplicar tema ao Ionic
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }
}
