import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import NotesPanel from '../../src/components/NotesPanel.vue';

const noteStore = vi.hoisted(() => ({
  note: Array.from({ length: 80 }, (_, index) => `Linha ${index + 1}`).join('\n'),
  loadNote: vi.fn(),
  saveNote: vi.fn()
}));

const settings = vi.hoisted(() => ({
  notesSide: 'left',
  notesWidth: 420,
  notesButtonTop: 120,
  opacityTargets: { notes: false }
}));

vi.mock('../../src/stores/noteStore', () => ({
  useNoteStore: () => noteStore
}));

vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: () => settings
}));

vi.mock('../../src/composables/useNotesDrag.js', () => ({
  NOTES_HANDLE_MIN_TOP: 64,
  useNotesDrag: () => ({
    onMouseDown: vi.fn(),
    isDragging: { value: false },
    hasMoved: { value: false }
  })
}));

vi.mock('@vueuse/core', () => ({
  useSwipe: () => ({
    lengthX: { value: 0 },
    isSwiping: { value: false }
  })
}));

describe('NotesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settings.notesButtonTop = 120;
  });

  it('mantém o editor como a região rolável do painel', async () => {
    const wrapper = mount(NotesPanel, { props: { isOpen: true } });
    await nextTick();

    const editor = wrapper.get('[data-test="notes-editor"]');
    expect(editor.classes()).toEqual(expect.arrayContaining([
      'min-h-0',
      'min-w-0',
      'overflow-y-auto',
      'overflow-x-hidden',
      'whitespace-pre-wrap',
      'break-words'
    ]));

    const scrollContainer = editor.element;
    const lineNumbers = wrapper.get('[data-test="notes-line-numbers"]').element;
    scrollContainer.scrollTop = 240;
    await editor.trigger('scroll');

    expect(lineNumbers.scrollTop).toBe(240);
  });

  it('não recorta a orelha externa usada para abrir e redimensionar o painel', () => {
    const wrapper = mount(NotesPanel, { props: { isOpen: true } });
    const panel = wrapper.get('[data-test="notes-panel"]');
    const dragHandle = wrapper.get('[data-test="notes-drag-handle"]');

    expect(panel.classes()).not.toContain('overflow-hidden');
    expect(dragHandle.classes()).toContain('left-full');
    expect(dragHandle.classes()).toContain('cursor-move');
  });

  it('mantém a orelha abaixo do cabeçalho mesmo com uma posição antiga menor', () => {
    settings.notesButtonTop = 20;
    const wrapper = mount(NotesPanel, { props: { isOpen: true } });

    expect(wrapper.get('[data-test="notes-drag-handle"]').attributes('style')).toContain('top: 64px');
  });
});
