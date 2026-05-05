import { ref, onMounted, onUnmounted, watch } from 'vue';

export function useWellness(settings) {
  const currentMessage = ref('');
  const showMessage = ref(false);
  let wellnessTimer = null;

  const messages = [
    "Dê uma espreguiçada e corrija a postura! 🧘‍♂️",
    "Hora de hidratar! Beba um pouco de água. 💧",
    "Descanse os olhos: olhe para o horizonte por 20 segundos. 👀",
    "Um copo d'água agora ajudaria muito no seu foco! 🥤",
    "Respire fundo três vezes... Inspirar, expirar. 🌬️",
    "Seus olhos agradecem: pisque algumas vezes. ✨",
    "Postura de mestre: ajuste a coluna e relaxe os ombros. 🏛️",
    "Água é o combustível do seu código. Já bebeu hoje? 🌊",
    "Hora de dar uma caminhada curta para esticar as pernas. 🚶‍♂️",
    "Que tal uma pausa de 2 minutos para um café ou chá? ☕"
  ];

  const triggerWellness = (force = false, customMessage = null) => {
    if (!settings.wellnessEnabled && !force) return;

    if (customMessage) {
      currentMessage.value = customMessage;
    } else {
      const randomIndex = Math.floor(Math.random() * messages.length);
      currentMessage.value = messages[randomIndex];
    }
    
    showMessage.value = true;

    setTimeout(() => {
      showMessage.value = false;
    }, 8000);
  };

  const startWellnessLoop = () => {
    stopWellnessLoop();
    if (!settings.wellnessEnabled) return;
    
    // Converte minutos para milissegundos
    const interval = settings.wellnessInterval * 60 * 1000; 
    wellnessTimer = setInterval(triggerWellness, interval);
  };

  const stopWellnessLoop = () => {
    if (wellnessTimer) clearInterval(wellnessTimer);
  };

  // Reinicia o ciclo se o usuário mudar o tempo ou ligar/desligar
  watch(() => [settings.wellnessInterval, settings.wellnessEnabled], () => {
    startWellnessLoop();
  }, { immediate: true });

  onMounted(() => {
    startWellnessLoop();
  });

  onUnmounted(() => {
    stopWellnessLoop();
  });

  return {
    currentMessage,
    showMessage,
    triggerWellness
  };
}
