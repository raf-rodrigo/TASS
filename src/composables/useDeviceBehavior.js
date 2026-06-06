import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUIStore } from '../stores/uiStore';

// Estado reativo global (singleton) para evitar múltiplos listeners caso o composable seja chamado em vários componentes
const isMobile = ref(window.innerWidth < 768);
let activeListeners = 0;

const handleResize = () => {
  isMobile.value = window.innerWidth < 768;
};

export function useDeviceBehavior() {
  const uiStore = useUIStore();

  onMounted(() => {
    if (activeListeners === 0) {
      window.addEventListener('resize', handleResize);
    }
    activeListeners++;
  });

  onUnmounted(() => {
    activeListeners--;
    if (activeListeners === 0) {
      window.removeEventListener('resize', handleResize);
    }
  });

  // Lista consolidada de modais de tela cheia ou sobrepostos
  const isAnyModalOpen = computed(() => {
    return uiStore.showWelcome || 
           uiStore.showTaskModal || 
           uiStore.showSettings || 
           uiStore.showGitRebuilder || 
           uiStore.showSprints || 
           uiStore.showInterfaceMenu || 
           uiStore.showTaskStyleBuilder ||
           uiStore.showTimeAdjustment;
  });

  // Lógica centralizada: Ocultar a dock principal se algum modal estiver ativo.
  // Isso evita que a dock (z-index muito alto) fique sobrepondo os rodapés e botões dos modais.
  const shouldHideDockForModal = computed(() => {
    // Se preferir limitar essa ocultação apenas ao mobile no futuro, bastaria adicionar:
    // return isMobile.value && isAnyModalOpen.value;
    return isAnyModalOpen.value;
  });

  return {
    isMobile,
    isAnyModalOpen,
    shouldHideDockForModal
  };
}
