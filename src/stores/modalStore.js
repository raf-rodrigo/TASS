import { defineStore } from 'pinia';
import { ref } from 'vue';

// v2.1 - Added Deny button support for complex flows (like GitLab)
export const useModalStore = defineStore('modal', () => {
  const isOpen = ref(false);
  const title = ref('');
  const message = ref('');
  const type = ref('info'); // info, warning, error, success
  const confirmText = ref('Confirmar');
  const cancelText = ref('Cancelar');
  const denyText = ref(null); // Terceiro botão (opcional)
  
  // Prompt Fields
  const isPrompt = ref(false);
  const promptType = ref('text'); // text, textarea
  const promptValue = ref('');
  const promptPlaceholder = ref('');
  
  const resolvePromise = ref(null);

  const reset = () => {
    isPrompt.value = false;
    promptValue.value = '';
    promptPlaceholder.value = '';
    promptType.value = 'text';
    denyText.value = null;
    cancelText.value = 'Cancelar';
    confirmText.value = 'Confirmar';
  };

  /**
   * Abre um modal de confirmação (suporta 2 ou 3 botões)
   * @returns Promise<'confirmed' | 'denied' | 'cancelled'>
   */
  const confirm = (options) => {
    reset();
    title.value = options.title || 'Confirmação';
    message.value = options.message || options.text || '';
    type.value = options.type || options.icon || 'info';
    confirmText.value = options.confirmText || 'Sim';
    cancelText.value = options.cancelText === null ? null : (options.cancelText || 'Cancelar');
    denyText.value = options.denyText || null;
    
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
   * Abre um modal de prompt
   */
  const prompt = (options) => {
    reset();
    title.value = options.title || 'Entrada de Dados';
    message.value = options.message || options.text || '';
    type.value = options.type || 'info';
    confirmText.value = options.confirmText || 'Salvar';
    cancelText.value = options.cancelText || 'Cancelar';
    denyText.value = options.denyText || null;
    
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
    const result = isPrompt.value ? promptValue.value : 'confirmed';
    isOpen.value = false;
    if (resolvePromise.value) resolvePromise.value(result);
  };

  const handleDeny = () => {
    isOpen.value = false;
    if (resolvePromise.value) resolvePromise.value('denied');
  };

  const handleCancel = () => {
    isOpen.value = false;
    if (resolvePromise.value) resolvePromise.value(isPrompt.value ? null : 'cancelled');
  };

  const clearPrompt = () => {
    if (isPrompt.value) {
      promptValue.value = '';
    }
  };

  return {
    isOpen,
    title,
    message,
    type,
    confirmText,
    cancelText,
    denyText,
    isPrompt,
    promptType,
    promptValue,
    promptPlaceholder,
    confirm,
    alert,
    prompt,
    handleConfirm,
    handleDeny,
    handleCancel,
    clearPrompt
  };
});
