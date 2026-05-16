import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useNoteStore } from '../../src/stores/noteStore';
import { db } from '../../src/db.js';

// Helper para criar o mock do encadeamento do Dexie
const createDexieMock = (lastValue) => ({
  toCollection: vi.fn().mockReturnThis(),
  last: vi.fn().mockResolvedValue(lastValue)
});

vi.mock('../../src/db.js', () => ({
  db: {
    notes: {
      toCollection: vi.fn(),
      add: vi.fn(),
      update: vi.fn()
    }
  }
}));

describe('NoteStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('deve carregar a última nota salva', async () => {
    const store = useNoteStore();
    const mockNote = { id: 1, content: 'Minha nota' };
    
    // Configura o mock para este teste específico
    db.notes.toCollection.mockReturnValue({
      last: vi.fn().mockResolvedValue(mockNote)
    });

    await store.loadNote();

    expect(store.note).toBe('Minha nota');
    expect(store.isLoaded).toBe(true);
  });

  it('deve salvar alterações na nota existente', async () => {
    const store = useNoteStore();
    
    // Simula que existe uma nota
    db.notes.toCollection.mockReturnValue({
      last: vi.fn().mockResolvedValue({ id: 1, content: 'velha' })
    });

    await store.saveNote('nova');

    expect(store.note).toBe('nova');
    expect(db.notes.update).toHaveBeenCalledWith(1, expect.objectContaining({ content: 'nova' }));
  });
});
