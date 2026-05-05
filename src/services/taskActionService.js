import Swal from '../utils/swal';
import { isValidUrl, ensureProtocol } from '../utils/validation';
import { notificationService } from './notificationService';

export const taskActionService = {
  /**
   * Abre um modal do SweetAlert para capturar uma entrada do usuário e atualizar a tarefa.
   * @param {Object} task - A tarefa a ser atualizada
   * @param {Object} taskStore - A store de tarefas para persistência
   * @param {String} field - O campo da tarefa a ser atualizado (ex: 'taskUrl', 'moreInfo')
   * @param {String} label - O rótulo amigável para o modal
   * @param {String} type - Tipo de validação ('url' ou 'text')
   */
  async promptQuickUpdate(task, taskStore, field, label, type = 'url') {
    const currentValue = task[field] || '';

    const { value: newValue } = await Swal.fire({
      title: `Cadastrar ${label}`,
      html: `
        <div class="p-1">
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 text-center">
            Insira o ${label.toLowerCase()} para esta tarefa
          </p>
          <div class="max-w-[calc(100%-2.25em)] mx-auto">
            <input 
              id="swal-input-custom" 
              class="tass-input my-4" 
              placeholder="${type === 'url' ? 'https://...' : 'Escreva aqui...'}"
              value="${currentValue}"
            >
            <div id="swal-error-custom" class="hidden bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest p-3 rounded-xl border border-red-500/20 mb-2 animate-shake"></div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Salvar',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false,
      customClass: {
        popup: 'tass-modal',
        confirmButton: 'btn btn-primary !px-8',
        cancelButton: 'btn btn-secondary !px-6',
        title: 'tass-modal-title'
      },
      didOpen: () => {
        const input = document.getElementById('swal-input-custom');
        const confirmButton = Swal.getConfirmButton();
        const errorDiv = document.getElementById('swal-error-custom');
        
        confirmButton.disabled = !input.value.trim();
        input.focus();

        input.addEventListener('input', (e) => {
          confirmButton.disabled = !e.target.value.trim();
          errorDiv.classList.add('hidden');
        });
      },
      preConfirm: () => {
        const value = document.getElementById('swal-input-custom').value.trim();
        const errorDiv = document.getElementById('swal-error-custom');
        
        if (!value) {
          errorDiv.textContent = 'O campo não pode estar vazio!';
          errorDiv.classList.remove('hidden');
          return false;
        }
        
        if (type === 'url' && !isValidUrl(value)) {
          errorDiv.textContent = 'Por favor, insira um link válido!';
          errorDiv.classList.remove('hidden');
          return false;
        }
        
        return value;
      }
    });

    if (newValue) {
      const formattedValue = type === 'url' ? ensureProtocol(newValue.trim()) : newValue.trim();
      try {
        await taskStore.updateTask(task.id, { [field]: formattedValue });
        notificationService.toast(`${label} salvo com sucesso!`, 'success');
        return true;
      } catch (error) {
        notificationService.toast('Erro ao salvar alteração.', 'error');
        return false;
      }
    }
    return false;
  }
};
