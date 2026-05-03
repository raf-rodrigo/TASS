import { onMounted, onUnmounted } from 'vue';

export function useShortcuts({ onToggleNotes, onOpenAddModal, onOpenSettings }) {
  const handleGlobalKeydown = (e) => {
    // Ignora se o foco estiver em campos de entrada de texto ou se teclas modificadoras estiverem pressionadas
    const activeTag = document.activeElement.tagName.toLowerCase();
    const isInput = activeTag === 'input' || 
                    activeTag === 'textarea' || 
                    activeTag === 'select' || 
                    document.activeElement.isContentEditable;
    
    if (isInput || e.ctrlKey || e.altKey || e.metaKey) return;

    const key = e.key.toLowerCase();

    switch (key) {
      case 'n':
        onToggleNotes();
        break;
      case 't':
        e.preventDefault(); // Evita scroll se houver
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
