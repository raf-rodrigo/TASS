import { onMounted, onUnmounted } from 'vue';

export function useShortcuts({ onToggleNotes, onOpenAddModal, onOpenSettings, onWellnessTest, isNotesOpen }) {
  const handleGlobalKeydown = (e) => {
    const open = typeof isNotesOpen === 'function' ? isNotesOpen() : (isNotesOpen?.value ?? isNotesOpen);

    if (open) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onToggleNotes(false);
      }
      return; // Ignora qualquer outro atalho global se o painel estiver aberto
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onToggleNotes(false);
      return;
    }

    // Verifica se o foco está em qualquer elemento editável — incluindo os dentro de modais complexos.
    // O activeElement pode ser o container do modal em vez do input filho, então usamos closest() como fallback.
    const active = document.activeElement;
    const activeTag = active?.tagName?.toLowerCase();
    const isInput = activeTag === 'input' || 
                    activeTag === 'textarea' || 
                    activeTag === 'select' || 
                    active?.isContentEditable ||
                    active?.closest('input, textarea, select, [contenteditable]') !== null;
    
    if (isInput) return;

    // Atalhos Simples (Letras Sozinhas)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key.toLowerCase();
    switch (key) {
      case 't':
        e.preventDefault();
        onToggleNotes();
        break;
      case 'w':
        e.preventDefault();
        if (onWellnessTest) onWellnessTest();
        break;
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleGlobalKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleGlobalKeydown);
  });
}
