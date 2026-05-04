import Swal from 'sweetalert2';

// Mixin para Toasts (Notificações)
export const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  customClass: {
    popup: 'tass-toast'
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

// Função para Confirmação
export const confirm = async (options) => {
  // Destruturamos nossas chaves customizadas para não enviá-las ao SweetAlert
  const { 
    confirmClass, cancelClass, denyClass, 
    message, confirmText, cancelText,
    ...nativeOptions 
  } = options;

  return Swal.fire({
    title: 'Tem certeza?',
    icon: 'info',
    showCancelButton: true,
    buttonsStyling: false,
    ...nativeOptions,
    confirmButtonText: options.confirmButtonText || options.confirmText || 'Sim',
    cancelButtonText: options.cancelButtonText || options.cancelText || 'Cancelar',
    customClass: {
      popup: 'tass-modal',
      confirmButton: confirmClass || 'btn btn-primary',
      cancelButton: cancelClass || 'btn btn-secondary',
      denyButton: denyClass || 'btn btn-secondary',
      ...(options.customClass || {})
    }
  });
};

export default Swal;
