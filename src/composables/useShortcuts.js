import { onMounted, onUnmounted } from 'vue';

export function useShortcuts({ onToggleNotes, onOpenAddModal, onOpenSettings, onWellnessTest }) {
  const handleGlobalKeydown = (e) => {
    if (e.key === 'Escape') {
      // Se o Notes estiver aberto (onToggleNotes), fechamos.
      // Como o useShortcuts recebe apenas o toggle, vamos garantir que ele só feche se algo estiver focado ou aberto
      onToggleNotes(false); // Vou ajustar para que o App.vue entenda o fechamento forçado
      return;
    }

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
        e.preventDefault();
        onToggleNotes();
        break;
      case 't':
        e.preventDefault();
        onOpenAddModal();
        break;
      case 'c':
        e.preventDefault();
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
