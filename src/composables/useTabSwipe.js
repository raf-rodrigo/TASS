import { ref, watch, nextTick } from 'vue';
import { useSwipe } from '@vueuse/core';
import { useDeviceBehavior } from './useDeviceBehavior';

export function useTabSwipe(activeTabRef, tabsArray, navRef, swipeAreaRef) {
  const { isMobile } = useDeviceBehavior();

  const offsetX = ref(0);
  const jumpMode = ref(false);
  const disableVueTransition = ref(false);

  const { lengthX, isSwiping } = useSwipe(swipeAreaRef, {
    threshold: 40,
    onSwipeEnd: (e, direction) => {
      if (!isMobile.value) return;

      const currentIndex = tabsArray.findIndex(t => t.id === activeTabRef.value);
      if (currentIndex === -1) return;

      const dir = String(direction).toUpperCase();
      
      if (dir === 'LEFT' && currentIndex < tabsArray.length - 1) {
        performSwipeOut(currentIndex + 1, -window.innerWidth);
      } 
      else if (dir === 'RIGHT' && currentIndex > 0) {
        performSwipeOut(currentIndex - 1, window.innerWidth);
      } else {
        offsetX.value = 0; // Snap back if threshold not met
      }
    }
  });

  const performSwipeOut = (newIndex, targetOffset) => {
    disableVueTransition.value = true;
    offsetX.value = targetOffset; // Anima para fora da tela suavemente

    setTimeout(() => {
      // Teletransporta para o lado oposto invisivelmente
      jumpMode.value = true;
      offsetX.value = -(targetOffset * 0.8); // Começa um pouco antes para ser mais rápido
      activeTabRef.value = tabsArray[newIndex].id;
      
      setTimeout(() => {
        // Anima para o centro
        jumpMode.value = false;
        offsetX.value = 0;
        
        setTimeout(() => {
          disableVueTransition.value = false;
        }, 300);
      }, 50);
    }, 250);
  };

  watch([isSwiping, lengthX], () => {
    if (isSwiping.value && !jumpMode.value) {
      offsetX.value = -lengthX.value;
    }
  });

  watch(activeTabRef, async (newVal) => {
    await nextTick();
    if (!navRef.value) return;
    const activeBtn = navRef.value.querySelector(`[data-tab-id="${newVal}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });

  return { offsetX, isSwiping, jumpMode, disableVueTransition };
}
