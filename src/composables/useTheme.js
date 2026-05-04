import { onMounted, watch } from 'vue';

export function useTheme(settings) {
  /**
   * Injeta variáveis CSS no :root do documento
   */
  const applyStyles = () => {
    const root = document.documentElement;
    
    // Cores base baseadas no tema
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.style.setProperty('--app-bg-raw', '30, 41, 59'); // slate-800
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--app-bg-raw', '255, 255, 255');
    }

    // Variáveis reativas de Opacidade baseadas nos Alvos
    const getOpacity = (targetEnabled) => {
      if (!targetEnabled) return settings.theme === 'dark' ? 0.98 : 0.95;
      return settings.cardOpacity / 100;
    };

    root.style.setProperty('--app-card-opacity', getOpacity(settings.opacityTargets.cards));
    root.style.setProperty('--app-bottom-opacity', getOpacity(settings.opacityTargets.bottomBar));
    root.style.setProperty('--app-action-opacity', getOpacity(settings.opacityTargets.actionBar));
    root.style.setProperty('--app-modal-opacity', getOpacity(settings.opacityTargets.modals));
    root.style.setProperty('--app-menu-opacity', getOpacity(settings.opacityTargets.contextMenu));
    
    // Outras medidas
    root.style.setProperty('--app-card-radius', settings.cardBorderRadius + 'px');
    root.style.setProperty('--app-card-padding', settings.cardPadding + 'px');
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
    settings.opacityTargets
  ], applyStyles, { deep: true });

  onMounted(() => {
    applyStyles();
  });

  return {
    applyTheme: applyStyles,
    toggleTheme
  };
}
