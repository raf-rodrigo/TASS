import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useUIStore = defineStore('ui', () => {
  // Modal Visibility States
  const showWelcome = ref(false);
  const showTaskModal = ref(false);
  const showSettings = ref(false);
  const showGitRebuilder = ref(false);
  const showSprints = ref(false);
  const showInterfaceMenu = ref(false);
  const showTaskStyleBuilder = ref(false);
  const showNotes = ref(false);
  const showRadio = ref(false);
  const showTimeAdjustment = ref(false);

  // Style Picker Menu and Live Preview
  const showStylePickerMenu = ref(false);
  const stylePickerPosition = ref({ x: 0, y: 0 });
  const previewTaskId = ref(null);
  const previewStyleId = ref(null);

  // Payloads / Intermediary states
  const taskToEdit = ref(null);
  const taskForTimeAdjustment = ref(null);
  const settingsInitialTab = ref(null);
  const interfaceInitialTab = ref(null);
  const sprintInitialShowAddForm = ref(false);
  const savedDockState = localStorage.getItem('tass_show_dock');
  const showGlobalDock = ref(savedDockState !== null ? savedDockState === 'true' : true);
  
  watch(showGlobalDock, (val) => {
    localStorage.setItem('tass_show_dock', val.toString());
  });
  
  // Workspace Context Menu
  const showWorkspaceContextMenu = ref(false);
  const workspaceContextMenuPosition = ref({ x: 0, y: 0 });

  // Actions
  const openTaskModal = (task = null) => {
    taskToEdit.value = task;
    showTaskModal.value = true;
  };

  const closeTaskModal = () => {
    showTaskModal.value = false;
    taskToEdit.value = null;
  };

  const openTimeAdjustment = (task) => {
    taskForTimeAdjustment.value = task;
    showTimeAdjustment.value = true;
  };

  const closeTimeAdjustment = () => {
    showTimeAdjustment.value = false;
    taskForTimeAdjustment.value = null;
  };

  const openSettings = (initialTab = null) => {
    settingsInitialTab.value = initialTab;
    showSettings.value = true;
  };

  const openInterfaceMenu = (initialTab = null) => {
    interfaceInitialTab.value = initialTab;
    showInterfaceMenu.value = true;
  };

  const openSprints = (showAddForm = false) => {
    sprintInitialShowAddForm.value = showAddForm;
    showSprints.value = true;
  };

  const toggleNotes = (forceState = null) => {
    if (forceState !== null) {
      showNotes.value = forceState;
    } else {
      showNotes.value = !showNotes.value;
    }
  };

  const openStylePicker = (task, event) => {
    if (showStylePickerMenu.value && previewTaskId.value === task.id) {
      closeStylePicker();
      return;
    }
    
    previewTaskId.value = task.id;
    previewStyleId.value = task.styleId || '';
    stylePickerPosition.value = { x: event.clientX, y: event.clientY };
    showStylePickerMenu.value = true;
  };

  const closeStylePicker = () => {
    showStylePickerMenu.value = false;
    previewTaskId.value = null;
    previewStyleId.value = null;
  };

  const closeAll = () => {
    showNotes.value = false;
    showSettings.value = false;
    showInterfaceMenu.value = false;
    showTaskModal.value = false;
    showSprints.value = false;
    showTaskStyleBuilder.value = false;
    showStylePickerMenu.value = false;
  };

  return {
    showWelcome, showTaskModal, showSettings, showGitRebuilder,
    showSprints, showInterfaceMenu, showTaskStyleBuilder, showNotes,
    showRadio, showTimeAdjustment, showGlobalDock,
    showWorkspaceContextMenu, workspaceContextMenuPosition,
    showStylePickerMenu, stylePickerPosition, previewTaskId, previewStyleId,
    taskToEdit, taskForTimeAdjustment, settingsInitialTab,
    interfaceInitialTab, sprintInitialShowAddForm,
    openTaskModal, closeTaskModal,
    openTimeAdjustment, closeTimeAdjustment,
    openSettings, openInterfaceMenu, openSprints,
    toggleNotes, openStylePicker, closeStylePicker, closeAll
  };
});
