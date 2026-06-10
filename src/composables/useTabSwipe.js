import { ref, watch, nextTick } from 'vue';
import { useSwipe } from '@vueuse/core';
import { useDeviceBehavior } from './useDeviceBehavior';

export function useTabSwipe(activeTabRef, tabsArray, navRef, swipeAreaRef) {
  const { isMobile } = useDeviceBehavior();

  const offsetX = ref(0);
  const jumpMode = ref(false);
  const disableVueTransition = ref(false);
  const swipeDirectionLocked = ref('none'); // 'none', 'horizontal', 'vertical'

  const { lengthX, lengthY, isSwiping } = useSwipe(swipeAreaRef, {
    threshold: 40,
    onSwipeStart: () => {
      swipeDirectionLocked.value = 'none';
    },
    onSwipeEnd: (e, direction) => {
      if (!isMobile.value) return;
      if (swipeDirectionLocked.value !== 'horizontal') {
        offsetX.value = 0;
        swipeDirectionLocked.value = 'none';
        return;
      }

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
      swipeDirectionLocked.value = 'none';
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

  watch([isSwiping, lengthX, lengthY], () => {
    if (!isMobile.value) return;

    if (!isSwiping.value) {
      return;
    }

    if (swipeDirectionLocked.value === 'none') {
      const absX = Math.abs(lengthX.value);
      const absY = Math.abs(lengthY.value);
      
      // Decidir a direção dominante se exceder o limite mínimo de 8px
      if (absX > 8 || absY > 8) {
        if (absX > absY * 1.5) {
          swipeDirectionLocked.value = 'horizontal';
        } else {
          swipeDirectionLocked.value = 'vertical';
        }
      }
    }

    if (swipeDirectionLocked.value === 'horizontal' && !jumpMode.value) {
      offsetX.value = -lengthX.value;
    } else {
      offsetX.value = 0;
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
