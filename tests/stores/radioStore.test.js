import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRadioStore } from '../../src/stores/radioStore';
import { db } from '../../src/db.js';

// Corrigindo o mock do construtor Audio
class MockAudio {
  constructor() {
    this.addEventListener = vi.fn();
    this.pause = vi.fn();
    this.play = vi.fn().mockResolvedValue();
    this.src = '';
    this.volume = 0.5;
  }
}
vi.stubGlobal('Audio', MockAudio);

// Mock do DB
vi.mock('../../src/db.js', () => ({
  db: {
    radios: {
      toArray: vi.fn(),
      filter: vi.fn(() => ({
        toArray: vi.fn().mockResolvedValue([])
      })),
      add: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}));

// Mock do notificationService
vi.mock('../../src/services/notificationService', () => ({
  notificationService: {
    toast: vi.fn()
  }
}));

describe('RadioStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('deve carregar rádios salvas na inicialização', async () => {
    const store = useRadioStore();
    db.radios.toArray.mockResolvedValue([
      { id: 1, name: 'Rádio 1', stars: 5 },
      { id: 2, name: 'Rádio 2', stars: 3 }
    ]);

    await store.init();

    expect(store.radios.length).toBe(2);
    expect(store.currentRadioId).toBe(1); // Primeira rádio (mais estrelas)
  });

  it('deve mudar de estação corretamente', () => {
    const store = useRadioStore();
    store.radios = [
      { id: 1, name: 'R1', url: 'u1' },
      { id: 2, name: 'R2', url: 'u2' }
    ];
    
    store.changeStation(2);
    expect(store.currentRadioId).toBe(2);
  });
});
