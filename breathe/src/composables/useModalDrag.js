import { ref, onUnmounted } from 'vue';

export function useModalDrag() {
  const position = ref({ x: 0, y: 0 });
  const isDragging = ref(false);
  const startPos = ref({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;

    isDragging.value = true;
    startPos.value = {
      x: e.clientX - position.value.x,
      y: e.clientY - position.value.y
    };

    document.body.classList.add('dragging-modal');
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e) => {
    if (!isDragging.value) return;

    position.value = {
      x: e.clientX - startPos.value.x,
      y: e.clientY - startPos.value.y
    };
  };

  const onMouseUp = () => {
    isDragging.value = false;
    document.body.classList.remove('dragging-modal');
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };

  onUnmounted(() => {
    onMouseUp();
  });

  return {
    position,
    isDragging,
    onMouseDown
  };
}
