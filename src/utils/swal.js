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
  return Swal.fire({
    title: options.title || 'Tem certeza?',
    text: options.message || '',
    icon: options.type === 'danger' ? 'warning' : 'info',
    showCancelButton: true,
    showDenyButton: options.showDenyButton || false,
    confirmButtonText: options.confirmText || 'Confirmar',
    cancelButtonText: options.cancelText || 'Cancelar',
    denyButtonText: options.denyButtonText || 'Recusar',
    customClass: {
      popup: 'tass-modal',
      title: 'swal2-title',
      confirmButton: options.confirmButtonClass || 'btn btn-primary',
      cancelButton: options.cancelButtonClass || 'btn btn-secondary',
      denyButton: options.denyButtonClass || 'btn btn-secondary'
    },
    buttonsStyling: false,
  });
};

export default Swal;
