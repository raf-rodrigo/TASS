import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false);
  const title = ref('');
  const message = ref('');
  const type = ref('info'); // info, warning, error, success
  const confirmText = ref('Confirmar');
  const cancelText = ref('Cancelar');
  
  // Prompt Fields
  const isPrompt = ref(false);
  const promptType = ref('text'); // text, textarea
  const promptValue = ref('');
  const promptPlaceholder = ref('');
  
  const resolvePromise = ref(null);

  /**
   * Abre um modal de confirmação
   */
  const confirm = (options) => {
    reset();
    title.value = options.title || 'Confirmação';
    message.value = options.message || options.text || '';
    type.value = options.type || options.icon || 'info';
    confirmText.value = options.confirmText || 'Sim';
    cancelText.value = options.cancelText || 'Cancelar';
    isOpen.value = true;

    return new Promise((resolve) => {
      resolvePromise.value = resolve;
    });
  };

  /**
   * Abre um modal de alerta
   */
  const alert = (options) => {
    reset();
    title.value = options.title || 'Alerta';
    message.value = options.message || options.text || '';
    type.value = options.type || options.icon || 'warning';
    confirmText.value = options.confirmText || 'Entendido';
    cancelText.value = null;
    isOpen.value = true;

    return new Promise((resolve) => {
      resolvePromise.value = resolve;
    });
  };

  /**
   * Abre um modal de prompt (entrada de texto)
   */
  const prompt = (options) => {
    reset();
    title.value = options.title || 'Entrada de Dados';
    message.value = options.message || options.text || '';
    type.value = options.type || 'info';
    confirmText.value = options.confirmText || 'Salvar';
    cancelText.value = options.cancelText || 'Cancelar';
    
    isPrompt.value = true;
    promptType.value = options.promptType || 'text';
    promptValue.value = options.value || '';
    promptPlaceholder.value = options.placeholder || '';
    
    isOpen.value = true;

    return new Promise((resolve) => {
      resolvePromise.value = resolve;
    });
  };

  const handleConfirm = () => {
    const result = isPrompt.value ? promptValue.value : true;
    isOpen.value = false;
    if (resolvePromise.value) resolvePromise.value(result);
  };

  const handleCancel = () => {
    isOpen.value = false;
    if (resolvePromise.value) resolvePromise.value(isPrompt.value ? null : false);
  };

  const reset = () => {
    isPrompt.value = false;
    promptValue.value = '';
    promptPlaceholder.value = '';
    promptType.value = 'text';
  };

  return {
    isOpen,
    title,
    message,
    type,
    confirmText,
    cancelText,
    isPrompt,
    promptType,
    promptValue,
    promptPlaceholder,
    confirm,
    alert,
    prompt,
    handleConfirm,
    handleCancel
  };
});
