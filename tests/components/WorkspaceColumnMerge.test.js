import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, shallowMount } from '@vue/test-utils';
import Workspace from '../../src/views/Workspace.vue';

const task = {
  id: 7,
  title: 'Tarefa com merge',
  branchName: 'feature/task-7',
  columnId: 1,
  position: 1
};

const taskStore = vi.hoisted(() => ({
  filteredTasks: [],
  statusFilter: 'active',
  updateAllPositions: vi.fn(async () => undefined),
  deleteTask: vi.fn(),
  toggleTaskCompletion: vi.fn()
}));

const settingsStore = vi.hoisted(() => ({
  activeSprintId: 'all',
  gitProvider: 'gitlab',
  activeEnvironments: [
    { id: 'dev', branch: 'dev', alias: 'Desenvolvimento' },
    { id: 'hml', branch: 'hml', alias: 'Homologação' }
  ],
  columnMergeTargets: {
    gitlab: ['', 'hml', '', '', '', ''],
    github: ['', '', '', '', '', '']
  }
}));

const notificationService = vi.hoisted(() => ({
  confirm: vi.fn(async () => true),
  toast: vi.fn()
}));

vi.mock('../../src/stores/taskStore', () => ({
  useTaskStore: () => taskStore
}));

vi.mock('../../src/stores/settingsStore', () => ({
  useSettingsStore: () => settingsStore
}));

vi.mock('../../src/services/notificationService.js', () => ({
  notificationService
}));

const TaskBoardStub = {
  name: 'TaskBoard',
  props: ['boardColumns', 'isDraggingTask'],
  emits: ['update-board'],
  template: '<div />'
};

const ColumnMergeModalStub = {
  name: 'ColumnMergeModal',
  props: ['sourceBranch', 'targetEnvironment'],
  emits: ['close'],
  template: '<div data-test="column-merge-modal" />'
};

describe('Workspace - merge configurado por coluna', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    task.columnId = 1;
    task.position = 1;
    taskStore.filteredTasks = [task];
    notificationService.confirm.mockResolvedValue(true);
  });

  it('pergunta e abre a análise Breeze ao mover para uma coluna configurada', async () => {
    const wrapper = shallowMount(Workspace, {
      global: {
        stubs: {
          TaskBoard: TaskBoardStub,
          ColumnMergeModal: ColumnMergeModalStub
        }
      }
    });
    const board = wrapper.getComponent(TaskBoardStub);
    const columns = board.props('boardColumns');
    columns[0].splice(0, 1);
    columns[1].push(task);

    board.vm.$emit('update-board', { added: { element: task } }, 2);
    await flushPromises();

    expect(taskStore.updateAllPositions).toHaveBeenCalled();
    expect(notificationService.confirm).toHaveBeenCalledWith(
      'Analisar merge da tarefa?',
      expect.stringContaining("'feature/task-7' em 'hml'"),
      'Analisar merge',
      'info'
    );

    const mergeModal = wrapper.getComponent(ColumnMergeModalStub);
    expect(mergeModal.props('sourceBranch')).toBe('feature/task-7');
    expect(mergeModal.props('targetEnvironment')).toEqual(
      expect.objectContaining({ id: 'hml', branch: 'hml' })
    );
  });
});
