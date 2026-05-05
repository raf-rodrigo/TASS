import { onMounted, onUnmounted } from 'vue';

export function useShortcuts({ onToggleNotes, onOpenAddModal, onOpenSettings, onWellnessTest }) {
  const handleGlobalKeydown = (e) => {
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isInput = activeTag === 'input' || 
                    activeTag === 'textarea' || 
                    activeTag === 'select' || 
                    document.activeElement.isContentEditable;
    
    if (isInput) return;

    // Atalhos com Alt
    if (e.altKey) {
      if (e.key.toLowerCase() === 'w' && onWellnessTest) {
        e.preventDefault();
        onWellnessTest();
      }
      return;
    }

    // Atalhos Simples (Letras Sozinhas)
    if (e.ctrlKey || e.metaKey) return;

    const key = e.key.toLowerCase();
    switch (key) {
      case 'n':
        onToggleNotes();
        break;
      case 't':
        e.preventDefault();
        onOpenAddModal();
        break;
      case 'c':
        onOpenSettings();
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
