import { onMounted, watch } from 'vue';

export function useTheme(settings) {
  /**
   * Injeta variáveis CSS no :root do documento
   */
  const applyStyles = () => {
    const root = document.documentElement;
    
    // Ajusta o fundo do body: 
    // Se tiver wallpaper, usamos um fundo escuro para evitar bordas brancas no blur.
    // Se não tiver, usamos a cor do tema.
    if (settings.backgroundImage) {
      document.body.style.backgroundColor = '#0f172a'; // Slate 900 (padrão para blur)
    } else {
      document.body.style.backgroundColor = settings.theme === 'dark' ? '#0f172a' : '#f8fafc';
    }
    
    // Cores base baseadas no tema
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--app-bg-raw', '15, 23, 42'); // Slate 900
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--app-bg-raw', '255, 255, 255');
    }

    // Variáveis reativas de Opacidade baseadas nos Alvos
    const getOpacity = (targetEnabled) => {
      if (!settings.globalGlassEnabled) return 1.0;
      if (!targetEnabled) return 1.0;
      return (100 - settings.cardOpacity) / 100;
    };

    root.style.setProperty('--app-card-opacity', getOpacity(settings.opacityTargets.cards));
    root.style.setProperty('--app-action-opacity', getOpacity(settings.opacityTargets.actionBar));
    root.style.setProperty('--app-modal-opacity', getOpacity(settings.opacityTargets.modals));
    root.style.setProperty('--app-modal-header-opacity', getOpacity(settings.opacityTargets.modalHeaderFooter));
    root.style.setProperty('--app-modal-sidebar-opacity', getOpacity(settings.opacityTargets.modalSidebar));
    root.style.setProperty('--app-modal-body-opacity', getOpacity(settings.opacityTargets.modalBody));
    root.style.setProperty('--app-alert-opacity', getOpacity(settings.opacityTargets.modals));
    root.style.setProperty('--app-menu-opacity', getOpacity(settings.opacityTargets.contextMenu));
    root.style.setProperty('--app-notes-opacity', getOpacity(settings.opacityTargets.notes));
    
    // Outras medidas
    root.style.setProperty('--app-card-radius', settings.cardBorderRadius + 'px');
    root.style.setProperty('--app-input-radius', Math.round(settings.cardBorderRadius * 0.6) + 'px');
    root.style.setProperty('--app-card-padding', settings.cardPadding + 'px');

    // --- Motor de Contraste Inteligente (Física de Renderização) ---
    const isEnhanced = settings.contrastEnhanced;
    const isDark = settings.theme === 'dark';

    // 1. Desfoque (Blur) - Glassmorphism 2.0 padrão 20px
    root.style.setProperty('--app-glass-blur', (settings.globalGlassEnabled && settings.cardOpacity > 0) ? '20px' : '0px');

    // 2. Brilho (Brightness) - Realça o fundo para destacar o texto
    let brightness = '1';
    if (isEnhanced) {
      brightness = isDark ? '0.85' : '1.05';
    }
    root.style.setProperty('--app-glass-brightness', brightness);

    // 3. Saturação (Saturate) - Separa cores no desfoque
    root.style.setProperty('--app-glass-saturate', isEnhanced ? '160%' : '100%');

    // 4. Sombra de Leitura (Text Shadow) - Proteção extra para o texto
    let textShadow = 'none';
    if (isEnhanced) {
      textShadow = isDark 
        ? '0 1px 1px rgba(0,0,0,0.4)' 
        : '0 1px 1px rgba(255,255,255,0.3)';
    }
    root.style.setProperty('--app-text-shadow', textShadow);
    
    // 5. Opacidade da Borda
    root.style.setProperty('--app-border-opacity', isDark ? '0.1' : '0.2');
  };

  const toggleTheme = () => {
    settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
    settings.saveSetting('app-theme', settings.theme);
    applyStyles();
  };

  // Observa mudanças nas configurações para atualizar o CSS em tempo real
  watch(() => [
    settings.cardOpacity, 
    settings.cardBorderRadius, 
    settings.cardPadding, 
    settings.theme,
    settings.opacityTargets,
    settings.globalGlassEnabled,
    settings.contrastEnhanced,
    settings.backgroundImage
  ], applyStyles, { deep: true });

  onMounted(() => {
    applyStyles();
  });

  return {
    applyTheme: applyStyles,
    toggleTheme
  };
}
