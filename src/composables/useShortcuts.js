import { onMounted, onUnmounted } from 'vue';

export function useShortcuts({ onToggleNotes, onOpenAddModal, onOpenSettings, onWellnessTest }) {
  const handleGlobalKeydown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onToggleNotes(false);
      return;
    }

    const activeTag = document.activeElement.tagName.toLowerCase();
    const isInput = activeTag === 'input' || 
                    activeTag === 'textarea' || 
                    activeTag === 'select' || 
                    document.activeElement.isContentEditable;
    
    if (isInput) return;

    // Atalhos Simples (Letras Sozinhas)
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const key = e.key.toLowerCase();
    switch (key) {
      case 't':
        e.preventDefault();
        onToggleNotes();
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
