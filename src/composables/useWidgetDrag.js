import { ref } from 'vue';

export function useWidgetDrag(settings, keyX = 'app-radio-pos-x', keyY = 'app-radio-pos-y') {
  const isDragging = ref(false);
  const startY = ref(0);
  const startX = ref(0);
  const startPosX = ref(0);
  const startPosY = ref(0);
  const hasMoved = ref(false);

  const onMouseDown = (e, posXRef, posYRef) => {
    if (e.button !== 0) return; // Only left click

    hasMoved.value = false;
    startY.value = e.clientY;
    startX.value = e.clientX;
    startPosX.value = posXRef.value;
    startPosY.value = posYRef.value;

    isDragging.value = true;

    const onMouseMove = (moveEvent) => {
      if (!isDragging.value) return;

      const deltaY = moveEvent.clientY - startY.value;
      const deltaX = moveEvent.clientX - startX.value;

      if (Math.abs(deltaY) > 5 || Math.abs(deltaX) > 5) {
        hasMoved.value = true;
      }

      // Calcula as novas posições
      let newX = startPosX.value + deltaX;
      let newY = startPosY.value + deltaY;

      // Limites da tela (assumindo que o widget tem em média 300px de largura e 100px de altura)
      // Mantendo-o dentro dos limites visíveis
      newX = Math.max(0, Math.min(window.innerWidth - 100, newX));
      newY = Math.max(0, Math.min(window.innerHeight - 100, newY));

      posXRef.value = newX;
      posYRef.value = newY;
    };

    const onMouseUp = () => {
      settings.saveSetting(keyX, posXRef.value);
      settings.saveSetting(keyY, posYRef.value);
      
      isDragging.value = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
    // Evita seleção de texto
    document.body.style.userSelect = 'none';
  };

  return {
    onMouseDown,
    hasMoved,
    isDragging
  };
}
