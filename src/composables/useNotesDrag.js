import { ref, onMounted, onUnmounted } from 'vue';

export function useNotesDrag(settings, showNotes, forcedMode = null) {
  const isDragging = ref(null); // 'vertical' or 'horizontal'
  const startY = ref(0);
  const startX = ref(0);
  const startTop = ref(0);
  const startWidth = ref(0);
  const hasMoved = ref(false);

  const onMouseDown = (e) => {
    // Only left click
    if (e.button !== 0) return;

    hasMoved.value = false;
    startY.value = e.clientY;
    startX.value = e.clientX;
    startTop.value = settings.notesButtonTop;
    startWidth.value = settings.notesWidth;

    // Se houver um modo forçado, usamos ele. Caso contrário, decidimos pelo estado do painel.
    isDragging.value = forcedMode || (showNotes.value ? 'horizontal' : 'vertical');

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
  };

  const onMouseMove = (e) => {
    if (!isDragging.value) return;

    const deltaY = e.clientY - startY.value;
    const deltaX = e.clientX - startX.value;

    if (Math.abs(deltaY) > 5 || Math.abs(deltaX) > 5) {
      hasMoved.value = true;
    }

    if (isDragging.value === 'vertical') {
      let newTop = startTop.value + deltaY;
      // Constraints
      newTop = Math.max(20, Math.min(window.innerHeight - 100, newTop));
      settings.notesButtonTop = newTop;
    } else if (isDragging.value === 'horizontal') {
      const direction = settings.notesSide === 'right' ? -1 : 1;
      let newWidth = startWidth.value + (deltaX * direction);
      // Constraints
      newWidth = Math.max(300, Math.min(window.innerWidth * 0.9, newWidth));
      settings.notesWidth = newWidth;
    }
  };

  const onMouseUp = () => {
    if (isDragging.value === 'vertical') {
      settings.saveSetting('app-notes-btn-top', settings.notesButtonTop);
    } else if (isDragging.value === 'horizontal') {
      settings.saveSetting('app-notes-width', settings.notesWidth);
    }
    
    isDragging.value = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.userSelect = '';
  };

  return {
    onMouseDown,
    hasMoved,
    isDragging
  };
}
