import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTheme } from '../../src/composables/useTheme';

describe('useTheme', () => {
  let mockSettings;
  let rootStyle;
  let classList;

  beforeEach(() => {
    // Mock do DOM
    rootStyle = {
      setProperty: vi.fn(),
      removeProperty: vi.fn()
    };
    classList = {
      add: vi.fn(),
      remove: vi.fn()
    };
    
    vi.stubGlobal('document', {
      documentElement: { style: rootStyle, classList },
      body: { style: { backgroundColor: '' } }
    });

    mockSettings = {
      theme: 'dark',
      cardOpacity: 80,
      cardBorderRadius: 16,
      cardPadding: 16,
      contrastEnhanced: true,
      backgroundImage: '',
      opacityTargets: {
        cards: true,
        bottomBar: true,
        modals: true,
        contextMenu: true,
        actionBar: true
      },
      saveSetting: vi.fn()
    };
  });

  it('deve aplicar as variáveis CSS corretas para o tema Dark', () => {
    const { applyTheme } = useTheme(mockSettings);
    applyTheme();

    expect(classList.add).toHaveBeenCalledWith('dark');
    expect(rootStyle.setProperty).toHaveBeenCalledWith('--app-bg-raw', '15, 23, 42');
  });

  it('deve aplicar as variáveis CSS corretas para o tema Light', () => {
    mockSettings.theme = 'light';
    const { applyTheme } = useTheme(mockSettings);
    applyTheme();

    expect(classList.remove).toHaveBeenCalledWith('dark');
    expect(rootStyle.setProperty).toHaveBeenCalledWith('--app-bg-raw', '255, 255, 255');
  });

  it('deve alternar o tema e salvar a configuração', () => {
    const { toggleTheme } = useTheme(mockSettings);
    
    toggleTheme(); // Dark -> Light
    expect(mockSettings.theme).toBe('light');
    expect(mockSettings.saveSetting).toHaveBeenCalledWith('app-theme', 'light');

    toggleTheme(); // Light -> Dark
    expect(mockSettings.theme).toBe('dark');
  });

  it('deve calcular a opacidade corretamente baseada no slider', () => {
    mockSettings.cardOpacity = 80; // 80% opacidade do slider = 0.2 no CSS (20% real)
    const { applyTheme } = useTheme(mockSettings);
    applyTheme();

    expect(rootStyle.setProperty).toHaveBeenCalledWith('--app-card-opacity', 0.2);
  });
});
