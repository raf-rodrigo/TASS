import { onMounted, onUnmounted } from 'vue';
import { useTaskStore } from '../stores/taskStore';
import { notificationService } from '../services/notificationService';
import { useUIStore } from '../stores/uiStore';
import { useTimerStore } from '../stores/timerStore';

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

const handleMousemove = (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
};

export function useTaskShortcuts() {
  const taskStore = useTaskStore();
  const uiStore = useUIStore();
  const timerStore = useTimerStore();

  const handleKeydown = async (e) => {
    // Ignora se estiver digitando em um input ou textarea (pra não roubar atalhos de texto)
    const tagName = e.target.tagName.toUpperCase();
    if (tagName === 'INPUT' || tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }

    const key = e.key.toLowerCase();

    // Atalhos com CTRL (Ctrl+V, Ctrl+B)
    if (e.ctrlKey && !e.altKey && !e.shiftKey && (key === 'v' || key === 'b')) {
      e.preventDefault();

      // Prioridade: Tarefa sob o mouse > Tarefa Selecionada
      const targetTask = taskStore.hoveredTask || taskStore.selectedTask;
      if (!targetTask) return; // Nenhuma tarefa em foco

      try {
        const text = await navigator.clipboard.readText();
        if (!text || text.trim() === '') {
          notificationService.toast('A área de transferência está vazia ou não é texto.', 'info');
          return;
        }

        const field = key === 'v' ? 'moreInfo' : 'dbScripts';
        const label = key === 'v' ? 'Anotações' : 'Scripts SQL';

        const currentContent = targetTask[field] || '';
        const newContent = currentContent ? `${currentContent}\n\n${text}` : text;

        await taskStore.updateTask(targetTask.id, { [field]: newContent });
        notificationService.toast(`Conteúdo anexado em ${label} da Tarefa ${targetTask.title}!`, 'success');
      } catch (err) {
        console.error('Erro ao acessar área de transferência:', err);
        notificationService.toast('Erro ao colar: Permissão negada ou falha na leitura', 'error');
      }
    }

    // Atalhos de Letra Única (Sem modificadores)
    if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
      const targetTask = taskStore.hoveredTask || taskStore.selectedTask;
      if (!targetTask) return;

      const clearSelection = () => {
        if (taskStore.selectedTask && taskStore.selectedTask.id === targetTask.id) {
          taskStore.selectedTask = null;
        }
      };

      if (key === 'e') {
        e.preventDefault();
        uiStore.openTaskModal(targetTask);
        clearSelection();
      } else if (key === 'f') {
        e.preventDefault();
        taskStore.toggleTaskCompletion(targetTask);
        clearSelection();
      } else if (key === 'c') {
        e.preventDefault();
        taskStore.cloneTask(targetTask);
        clearSelection();
      } else if (key === 'z') {
        e.preventDefault();
        // Dispara de forma assíncrona para não prender o event loop se não precisar
        (async () => {
          const confirmed = await notificationService.confirm(
            'Zerar Tempo',
            'Tem certeza que deseja zerar o tempo desta tarefa? Esta ação não pode ser desfeita.',
            'Zerar Agora',
            'warning'
          );
          if (confirmed) {
            await timerStore.resetTaskTime(targetTask.id);
          }
        })();
        clearSelection();
      } else if (key === 'd') {
        e.preventDefault();
        (async () => {
          const confirmed = await notificationService.confirm(
            'Excluir Tarefa',
            'Tem certeza que deseja excluir esta tarefa?',
            'Excluir',
            'error'
          );
          if (confirmed) {
            await taskStore.deleteTask(targetTask.id);
          }
        })();
        clearSelection();
      } else if (key === 'p') {
        e.preventDefault();
        uiStore.openStylePicker(targetTask, { clientX: mouseX, clientY: mouseY });
      }
    }
  };

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('mousemove', handleMousemove);
  });

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('mousemove', handleMousemove);
  });
}
