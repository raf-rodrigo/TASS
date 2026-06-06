<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { 
  Palette, Layout, Save, Trash2, Plus, ArrowRight, Copy,
  Monitor, Layers, CircleDot, Play, MoreVertical, Sparkles, CheckCircle2, X, Coffee, Camera, Moon, Heart, Zap
} from 'lucide-vue-next';
import { useSettingsStore } from '../stores/settingsStore';
import { useTaskStyleStore } from '../stores/taskStyleStore';
import { notificationService } from '../services/notificationService';
import { hexToRgba } from '../utils/colors.js';

import BaseModal from './BaseModal.vue';
import AppColorPalette from './AppColorPalette.vue';
import AppInput from './base/AppInput.vue';

const emit = defineEmits(['close']);
const settings = useSettingsStore();
const taskStyleStore = useTaskStyleStore();

// 'global', 'new', or style UUID
const selectedTargetId = ref('global');

// Estado isolado em edição
const editingData = ref({
  name: '',
  styles: {
    cardPadding: 16,
    taskNumberSize: 12,
    taskDescriptionSize: 14,
    taskTimerSize: 14,
    taskMinHeight: 100,
    taskMaxWidth: 0
  },
  colors: {
    color: '',
    bgColor: '',
    textLightColor: '',
    textDarkColor: ''
  }
});

const loadTargetData = () => {
  if (selectedTargetId.value === 'global') {
    editingData.value = {
      name: 'Padrão Global',
      styles: {
        cardPadding: settings.cardPadding || 16,
        taskNumberSize: settings.taskNumberSize || 12,
        taskDescriptionSize: settings.taskDescriptionSize || 14,
        taskTimerSize: settings.taskTimerSize || 14,
        taskMinHeight: settings.taskMinHeight || 100,
        taskMaxWidth: settings.taskMaxWidth || 0
      },
      colors: { color: '', bgColor: '', textLightColor: '', textDarkColor: '' }
    };
    isEditingName.value = false;
  } else if (selectedTargetId.value === 'new') {
    editingData.value = {
      name: 'Novo Preset',
      styles: {
        cardPadding: 16,
        taskNumberSize: 12,
        taskDescriptionSize: 14,
        taskTimerSize: 14,
        taskMinHeight: 100,
        taskMaxWidth: 0
      },
      colors: { color: '#6366f1', bgColor: '', textLightColor: '', textDarkColor: '' }
    };
    editingNameValue.value = '';
    isEditingName.value = true;
  } else {
    const preset = taskStyleStore.getStyleById(selectedTargetId.value);
    if (preset) {
      editingData.value = JSON.parse(JSON.stringify(preset));
    }
    isEditingName.value = false;
  }
};

onMounted(() => {
  loadTargetData();
});

watch(selectedTargetId, () => {
  loadTargetData();
});

const isEditingName = ref(false);
const editingNameValue = ref('');

const startEditName = () => {
  if (selectedTargetId.value === 'global') return;
  editingNameValue.value = editingData.value.name;
  isEditingName.value = true;
};

const saveName = async () => {
  if (editingNameValue.value.trim()) {
    editingData.value.name = editingNameValue.value.trim();
  }
  isEditingName.value = false;

  // Se estiver criando um novo preset, já salva automaticamente
  if (selectedTargetId.value === 'new') {
    await handleSave();
  }
};

// Aba ativa dentro da edição
const activeEditorTab = ref('colors'); // 'colors' ou 'geometry'

const handleSave = async () => {
  if (isEditingName.value) {
    saveName();
  }

  try {
    if (selectedTargetId.value === 'global') {
      settings.cardPadding = editingData.value.styles.cardPadding;
      settings.taskNumberSize = editingData.value.styles.taskNumberSize;
      settings.taskDescriptionSize = editingData.value.styles.taskDescriptionSize;
      settings.taskTimerSize = editingData.value.styles.taskTimerSize;
      settings.taskMinHeight = editingData.value.styles.taskMinHeight;
      settings.taskMaxWidth = editingData.value.styles.taskMaxWidth;
      await settings.saveAllSettings();
      notificationService.toast('Padrão Global atualizado com sucesso!', 'success');
    } else {
      // É um preset (novo ou existente)
      if (!editingData.value.name || editingData.value.name === 'Novo Preset') {
        notificationService.toast('Dê um nome válido para o preset.', 'warning');
        startEditName();
        return;
      }
      
      const payload = {
        id: selectedTargetId.value === 'new' ? Date.now().toString() : selectedTargetId.value,
        name: editingData.value.name,
        styles: { ...editingData.value.styles },
        colors: { ...editingData.value.colors }
      };
      
      await taskStyleStore.saveStyle(payload);
      selectedTargetId.value = payload.id; // Foca no preset recém-salvo
    }
  } catch (error) {
    console.error("Erro ao salvar:", error);
    notificationService.toast('Falha ao salvar as configurações.', 'error');
  }
};

const handleDuplicate = async () => {
  if (!selectedTargetId.value || selectedTargetId.value === 'new') return;
  
  const baseName = editingData.value.name || 'Novo Preset';
  const newName = (baseName === 'Padrão Global' ? 'Novo Preset' : baseName) + ' (Cópia)';
  
  const duplicatedStyle = {
    id: crypto.randomUUID(),
    name: newName,
    colors: JSON.parse(JSON.stringify(editingData.value.colors)),
    styles: JSON.parse(JSON.stringify(editingData.value.styles))
  };
  
  await taskStyleStore.saveStyle(duplicatedStyle);
  selectedTargetId.value = duplicatedStyle.id;
  
  isEditingName.value = true;
  editingNameValue.value = duplicatedStyle.name;
  
  notificationService.toast('Preset duplicado com sucesso!', 'success');
};

const handleDelete = async () => {
  if (selectedTargetId.value === 'global' || selectedTargetId.value === 'new') return;
  const confirmed = await notificationService.confirm('Excluir Preset?', `Deseja realmente apagar o preset "${editingData.value.name}"?`, 'Sim, Apagar', 'error');
  if (confirmed) {
    await taskStyleStore.deleteStyle(selectedTargetId.value);
    selectedTargetId.value = 'global';
  }
};



const injectVintageStyles = async () => {
  const vintageStyles = [
    { id: 'v-1', name: 'Vintage Faded', styles: { cardPadding: 16, taskNumberSize: 14, taskDescriptionSize: 14, taskTimerSize: 12, taskMinHeight: 120, taskMaxWidth: 0 }, colors: { color: '#E76F51', bgColor: '#F4A261', textLightColor: '#264653', textDarkColor: '#264653' } },
    { id: 'v-2', name: '70s Earth', styles: { cardPadding: 20, taskNumberSize: 16, taskDescriptionSize: 15, taskTimerSize: 14, taskMinHeight: 100, taskMaxWidth: 0 }, colors: { color: '#D4A373', bgColor: '#FEFAE0', textLightColor: '#FAEDCD', textDarkColor: '#283618' } },
    { id: 'v-3', name: 'Old Newspaper', styles: { cardPadding: 12, taskNumberSize: 18, taskDescriptionSize: 14, taskTimerSize: 12, taskMinHeight: 140, taskMaxWidth: 0 }, colors: { color: '#BC6C25', bgColor: '#FEFAE0', textLightColor: '#DDA15E', textDarkColor: '#283618' } },
    { id: 'v-4', name: 'Faded Seaside', styles: { cardPadding: 16, taskNumberSize: 14, taskDescriptionSize: 15, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#FB8500', bgColor: '#8ECAE6', textLightColor: '#219EBC', textDarkColor: '#023047' } },
    { id: 'v-5', name: 'Vintage Rose', styles: { cardPadding: 24, taskNumberSize: 12, taskDescriptionSize: 14, taskTimerSize: 12, taskMinHeight: 90, taskMaxWidth: 0 }, colors: { color: '#CB997E', bgColor: '#FFE8D6', textLightColor: '#DDBEA9', textDarkColor: '#6B705C' } },
    { id: 'v-6', name: 'Classic Autumn', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 16, taskTimerSize: 14, taskMinHeight: 130, taskMaxWidth: 0 }, colors: { color: '#9C6644', bgColor: '#EDE0D4', textLightColor: '#DDB892', textDarkColor: '#7F4F24' } },
    { id: 'v-7', name: 'Nostalgic Mint', styles: { cardPadding: 20, taskNumberSize: 14, taskDescriptionSize: 13, taskTimerSize: 12, taskMinHeight: 100, taskMaxWidth: 0 }, colors: { color: '#52796F', bgColor: '#CAD2C5', textLightColor: '#84A98C', textDarkColor: '#2F3E46' } },
    { id: 'v-8', name: 'Muted Berry', styles: { cardPadding: 16, taskNumberSize: 18, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 120, taskMaxWidth: 0 }, colors: { color: '#9D8189', bgColor: '#FFE5D9', textLightColor: '#F4ACB7', textDarkColor: '#5C4A4E' } },
    { id: 'v-9', name: 'Sepia Tone', styles: { cardPadding: 16, taskNumberSize: 14, taskDescriptionSize: 15, taskTimerSize: 12, taskMinHeight: 100, taskMaxWidth: 0 }, colors: { color: '#CA8A04', bgColor: '#FEF08A', textLightColor: '#A16207', textDarkColor: '#713F12' } },
    { id: 'v-10', name: 'Retro Sunset', styles: { cardPadding: 24, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 150, taskMaxWidth: 0 }, colors: { color: '#FF7B54', bgColor: '#FFD56F', textLightColor: '#939B62', textDarkColor: '#3D3C42' } }
  ];

  let added = 0;
  for (const style of vintageStyles) {
    if (!taskStyleStore.styles.some(s => s.id === style.id)) {
      await taskStyleStore.saveStyle(style);
      added++;
    }
  }
  
  if (added > 0) {
    notificationService.toast(`${added} Estilos Vintage importados!`, 'success');
  } else {
    notificationService.toast('Os estilos vintage já existem.', 'info');
  }
};

const injectCoffeeStyles = async () => {
  const coffeeStyles = [
    { id: 'c-1', name: 'Espresso Intenso', styles: { cardPadding: 24, taskNumberSize: 16, taskDescriptionSize: 15, taskTimerSize: 14, taskMinHeight: 120, taskMaxWidth: 0 }, colors: { color: '#8D6E63', bgColor: '#3E2723', textLightColor: '#D7CCC8', textDarkColor: '#D7CCC8' } },
    { id: 'c-2', name: 'Latte Cremoso', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 12, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#5D4037', bgColor: '#EFEBE9', textLightColor: '#8D6E63', textDarkColor: '#4E342E' } },
    { id: 'c-3', name: 'Mocha Chocolate', styles: { cardPadding: 20, taskNumberSize: 18, taskDescriptionSize: 14, taskTimerSize: 16, taskMinHeight: 130, taskMaxWidth: 0 }, colors: { color: '#ECB176', bgColor: '#4A3B32', textLightColor: '#FED8B1', textDarkColor: '#FED8B1' } },
    { id: 'c-4', name: 'Caramel Macchiato', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 100, taskMaxWidth: 0 }, colors: { color: '#8B4513', bgColor: '#FFF8E7', textLightColor: '#A0522D', textDarkColor: '#5C4033' } },
    { id: 'c-5', name: 'Flat White', styles: { cardPadding: 24, taskNumberSize: 12, taskDescriptionSize: 13, taskTimerSize: 12, taskMinHeight: 90, taskMaxWidth: 0 }, colors: { color: '#4E342E', bgColor: '#FAFAFA', textLightColor: '#9E9E9E', textDarkColor: '#616161' } },
    { id: 'c-6', name: 'Iced Coffee', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 16, taskTimerSize: 14, taskMinHeight: 100, taskMaxWidth: 0 }, colors: { color: '#3E2723', bgColor: '#E6D0B3', textLightColor: '#8B5A2B', textDarkColor: '#5C4033' } },
    { id: 'c-7', name: 'Grãos Torrados', styles: { cardPadding: 20, taskNumberSize: 18, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#C19A6B', bgColor: '#1A1110', textLightColor: '#EEDC82', textDarkColor: '#EEDC82' } },
    { id: 'c-8', name: 'Café com Leite', styles: { cardPadding: 12, taskNumberSize: 14, taskDescriptionSize: 15, taskTimerSize: 12, taskMinHeight: 80, taskMaxWidth: 0 }, colors: { color: '#5C4033', bgColor: '#F5DEB3', textLightColor: '#8B4513', textDarkColor: '#3E2723' } },
    { id: 'c-9', name: 'Cappuccino Quente', styles: { cardPadding: 16, taskNumberSize: 15, taskDescriptionSize: 14, taskTimerSize: 13, taskMinHeight: 120, taskMaxWidth: 0 }, colors: { color: '#8D6E63', bgColor: '#FFF3E0', textLightColor: '#FFB74D', textDarkColor: '#5D4037' } },
    { id: 'c-10', name: 'Cafeteria Cozy', styles: { cardPadding: 24, taskNumberSize: 14, taskDescriptionSize: 15, taskTimerSize: 14, taskMinHeight: 140, taskMaxWidth: 0 }, colors: { color: '#A67B5B', bgColor: '#6F4E37', textLightColor: '#ECB176', textDarkColor: '#ECB176' } }
  ];

  let added = 0;
  for (const style of coffeeStyles) {
    if (!taskStyleStore.styles.some(s => s.id === style.id)) {
      await taskStyleStore.saveStyle(style);
      added++;
    }
  }
  
  if (added > 0) {
    notificationService.toast(`${added} Estilos de Café importados!`, 'success');
  } else {
    notificationService.toast('Os estilos de café já existem.', 'info');
  }
};

const injectNightStyles = async () => {
  const nightStyles = [
    { id: 'n-1', name: 'Midnight Blue', styles: { cardPadding: 20, taskNumberSize: 14, taskDescriptionSize: 14, taskTimerSize: 12, taskMinHeight: 120, taskMaxWidth: 0 }, colors: { color: '#63B3ED', bgColor: '#0B192C', textLightColor: '#E2E8F0', textDarkColor: '#E2E8F0' } },
    { id: 'n-2', name: 'Violet Night', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 15, taskTimerSize: 14, taskMinHeight: 100, taskMaxWidth: 0 }, colors: { color: '#E94560', bgColor: '#1A1A2E', textLightColor: '#F8FAFC', textDarkColor: '#F8FAFC' } },
    { id: 'n-3', name: 'Dark Forest', styles: { cardPadding: 24, taskNumberSize: 18, taskDescriptionSize: 14, taskTimerSize: 16, taskMinHeight: 140, taskMaxWidth: 0 }, colors: { color: '#10B981', bgColor: '#0F172A', textLightColor: '#A7F3D0', textDarkColor: '#A7F3D0' } },
    { id: 'n-4', name: 'Aurora Borealis', styles: { cardPadding: 12, taskNumberSize: 14, taskDescriptionSize: 14, taskTimerSize: 12, taskMinHeight: 90, taskMaxWidth: 0 }, colors: { color: '#14B8A6', bgColor: '#020617', textLightColor: '#5EEAD4', textDarkColor: '#5EEAD4' } },
    { id: 'n-5', name: 'Neon City', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 15, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#8B5CF6', bgColor: '#09090B', textLightColor: '#C4B5FD', textDarkColor: '#C4B5FD' } },
    { id: 'n-6', name: 'Deep Ocean', styles: { cardPadding: 24, taskNumberSize: 14, taskDescriptionSize: 16, taskTimerSize: 12, taskMinHeight: 130, taskMaxWidth: 0 }, colors: { color: '#669BBC', bgColor: '#001220', textLightColor: '#F1F5F9', textDarkColor: '#F1F5F9' } },
    { id: 'n-7', name: 'Blood Moon', styles: { cardPadding: 16, taskNumberSize: 18, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 100, taskMaxWidth: 0 }, colors: { color: '#FCA5A5', bgColor: '#171717', textLightColor: '#FEF2F2', textDarkColor: '#FEF2F2' } },
    { id: 'n-8', name: 'Starlight', styles: { cardPadding: 20, taskNumberSize: 12, taskDescriptionSize: 15, taskTimerSize: 14, taskMinHeight: 120, taskMaxWidth: 0 }, colors: { color: '#F3F4F6', bgColor: '#111827', textLightColor: '#9CA3AF', textDarkColor: '#9CA3AF' } },
    { id: 'n-9', name: 'Purple Haze', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 16, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#7C3AED', bgColor: '#2E1065', textLightColor: '#DDD6FE', textDarkColor: '#DDD6FE' } },
    { id: 'n-10', name: 'Graphite', styles: { cardPadding: 16, taskNumberSize: 14, taskDescriptionSize: 14, taskTimerSize: 12, taskMinHeight: 90, taskMaxWidth: 0 }, colors: { color: '#A1A1AA', bgColor: '#18181B', textLightColor: '#D4D4D8', textDarkColor: '#D4D4D8' } }
  ];

  let added = 0;
  for (const style of nightStyles) {
    if (!taskStyleStore.styles.some(s => s.id === style.id)) {
      await taskStyleStore.saveStyle(style);
      added++;
    }
  }
  
  if (added > 0) {
    notificationService.toast(`${added} Estilos Noturnos importados!`, 'success');
  } else {
    notificationService.toast('Os estilos noturnos já existem.', 'info');
  }
};

const injectPopularStyles = async () => {
  const popularStyles = [
    { id: 'p-1', name: 'Retro Sunset', styles: { cardPadding: 20, taskNumberSize: 14, taskDescriptionSize: 15, taskTimerSize: 14, taskMinHeight: 120, taskMaxWidth: 0 }, colors: { color: '#FF5733', bgColor: '#FFC300', textLightColor: '#581845', textDarkColor: '#900C3F' } },
    { id: 'p-2', name: 'Soft Muted', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#E07A5F', bgColor: '#F4F1DE', textLightColor: '#3D405B', textDarkColor: '#3D405B' } },
    { id: 'p-3', name: 'Matcha Green', styles: { cardPadding: 24, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 12, taskMinHeight: 100, taskMaxWidth: 0 }, colors: { color: '#D4A373', bgColor: '#E9EDC9', textLightColor: '#4E5A44', textDarkColor: '#4E5A44' } },
    { id: 'p-4', name: 'Cyber Grape', styles: { cardPadding: 16, taskNumberSize: 15, taskDescriptionSize: 15, taskTimerSize: 14, taskMinHeight: 90, taskMaxWidth: 0 }, colors: { color: '#E84545', bgColor: '#2B2E4A', textLightColor: '#F5F5F5', textDarkColor: '#F5F5F5' } },
    { id: 'p-5', name: 'Ocean Breeze', styles: { cardPadding: 16, taskNumberSize: 14, taskDescriptionSize: 14, taskTimerSize: 12, taskMinHeight: 120, taskMaxWidth: 0 }, colors: { color: '#05386B', bgColor: '#5CDB95', textLightColor: '#05386B', textDarkColor: '#05386B' } },
    { id: 'p-6', name: 'Dusty Pink', styles: { cardPadding: 20, taskNumberSize: 18, taskDescriptionSize: 14, taskTimerSize: 12, taskMinHeight: 100, taskMaxWidth: 0 }, colors: { color: '#F67280', bgColor: '#F8B195', textLightColor: '#355C7D', textDarkColor: '#355C7D' } },
    { id: 'p-7', name: 'Crimson Dark', styles: { cardPadding: 20, taskNumberSize: 14, taskDescriptionSize: 15, taskTimerSize: 14, taskMinHeight: 130, taskMaxWidth: 0 }, colors: { color: '#C3073F', bgColor: '#1A1A1D', textLightColor: '#FFFFFF', textDarkColor: '#FFFFFF' } },
    { id: 'p-8', name: 'Velvet Royal', styles: { cardPadding: 12, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 12, taskMinHeight: 80, taskMaxWidth: 0 }, colors: { color: '#88BDBC', bgColor: '#112D32', textLightColor: '#EDF5E1', textDarkColor: '#EDF5E1' } },
    { id: 'p-9', name: 'Beach Pastel', styles: { cardPadding: 24, taskNumberSize: 12, taskDescriptionSize: 16, taskTimerSize: 14, taskMinHeight: 140, taskMaxWidth: 0 }, colors: { color: '#F79489', bgColor: '#F9F1F0', textLightColor: '#904343', textDarkColor: '#904343' } },
    { id: 'p-10', name: 'Candy Shop', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 100, taskMaxWidth: 0 }, colors: { color: '#845EC2', bgColor: '#FF9671', textLightColor: '#2C1B40', textDarkColor: '#2C1B40' } }
  ];

  let added = 0;
  for (const style of popularStyles) {
    if (!taskStyleStore.styles.some(s => s.id === style.id)) {
      await taskStyleStore.saveStyle(style);
      added++;
    }
  }
  
  if (added > 0) {
    notificationService.toast(`${added} Estilos Populares importados!`, 'success');
  } else {
    notificationService.toast('Os estilos populares já existem.', 'info');
  }
};

const injectNeonStyles = async () => {
  const neonStyles = [
    { id: 'neon-1', name: 'Cyber Pink', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#FF2A7A', bgColor: '#1A0B16', textLightColor: '#FF94B8', textDarkColor: '#FF94B8' } },
    { id: 'neon-2', name: 'Matrix Green', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#00FF41', bgColor: '#0D1A12', textLightColor: '#8CFFAC', textDarkColor: '#8CFFAC' } },
    { id: 'neon-3', name: 'Synthwave Blue', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#00F0FF', bgColor: '#0B161A', textLightColor: '#99F8FF', textDarkColor: '#99F8FF' } },
    { id: 'neon-4', name: 'Laser Lemon', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#FFFF00', bgColor: '#1A1A00', textLightColor: '#FFFF99', textDarkColor: '#FFFF99' } },
    { id: 'neon-5', name: 'Neon Purple', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#B026FF', bgColor: '#120B1A', textLightColor: '#DDA3FF', textDarkColor: '#DDA3FF' } },
    { id: 'neon-6', name: 'Electric Orange', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#FF5E00', bgColor: '#1A0E0B', textLightColor: '#FFAD80', textDarkColor: '#FFAD80' } },
    { id: 'neon-7', name: 'Radioactive', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#CCFF00', bgColor: '#141A00', textLightColor: '#E5FF80', textDarkColor: '#E5FF80' } },
    { id: 'neon-8', name: 'Hot Magenta', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#FF0090', bgColor: '#1A000F', textLightColor: '#FF80C8', textDarkColor: '#FF80C8' } },
    { id: 'neon-9', name: 'Tron Cyan', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#7DF9FF', bgColor: '#071A1A', textLightColor: '#BFFFFF', textDarkColor: '#BFFFFF' } },
    { id: 'neon-10', name: 'Plasma Red', styles: { cardPadding: 16, taskNumberSize: 16, taskDescriptionSize: 14, taskTimerSize: 14, taskMinHeight: 110, taskMaxWidth: 0 }, colors: { color: '#FF003C', bgColor: '#1A0006', textLightColor: '#FF809D', textDarkColor: '#FF809D' } }
  ];

  let added = 0;
  for (const style of neonStyles) {
    if (!taskStyleStore.styles.some(s => s.id === style.id)) {
      await taskStyleStore.saveStyle(style);
      added++;
    }
  }
  
  if (added > 0) {
    notificationService.toast(`${added} Estilos Neon importados!`, 'success');
  } else {
    notificationService.toast('Os estilos neon já existem.', 'info');
  }
};

// Mock Properties for Preview
const hoveredTargetId = ref(null);

const previewData = computed(() => {
  if (hoveredTargetId.value && hoveredTargetId.value !== 'new') {
    const style = taskStyleStore.getStyleById(hoveredTargetId.value);
    if (style) return { name: style.name, styles: style.styles, colors: style.colors };
  }
  return editingData.value;
});

const mockTextColor = computed(() => {
  if (settings.theme === 'dark' && previewData.value.colors.textDarkColor) return previewData.value.colors.textDarkColor;
  if (settings.theme !== 'dark' && previewData.value.colors.textLightColor) return previewData.value.colors.textLightColor;
  return 'var(--app-text-sub)';
});

const isSquareLayout = computed(() => {
  return previewData.value.styles.taskMinHeight >= 80 || (previewData.value.styles.taskMaxWidth > 0 && previewData.value.styles.taskMaxWidth <= 280);
});
</script>

<template>
  <BaseModal 
    title="Construtor Visual" 
    subtitle="WYSIWYG: Veja exatamente o que está criando."
    :icon="Palette"
    maxWidth="max-w-6xl" 
    customClass="h-[95vh] md:h-[750px] flex flex-col"
    layout="sidebar"
    @close="emit('close')"
  >
    <!-- Sidebar de Presets -->
    <template #sidebar>
      <div class="flex flex-col h-full w-full">
        <div class="px-2 pb-3 pt-1">
          <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Estilo Base</p>
          <button 
            @click="selectedTargetId = 'global'"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border border-transparent"
            :class="selectedTargetId === 'global' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
          >
            <Monitor class="w-4 h-4" />
            <span class="text-xs font-bold">Padrão Global</span>
          </button>
        </div>

        <div class="px-2 py-3 flex-1 overflow-y-auto custom-scrollbar border-t border-slate-200 dark:border-white/10">
          <div class="flex items-center justify-between mb-3">
            <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Seus Presets</p>
            <div class="flex items-center gap-1">
              <button @click="injectPopularStyles" class="p-1 text-pink-500 hover:bg-pink-500/10 rounded-lg transition-all" data-tip="Gerar 10 Estilos Populares">
                <Heart class="w-4 h-4" />
              </button>
              <button @click="injectNeonStyles" class="p-1 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-all" data-tip="Gerar 10 Estilos Neon">
                <Zap class="w-4 h-4" />
              </button>
              <button @click="injectNightStyles" class="p-1 text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all" data-tip="Gerar 10 Estilos Night">
                <Moon class="w-4 h-4" />
              </button>
              <button @click="injectCoffeeStyles" class="p-1 text-amber-700 hover:bg-amber-700/10 rounded-lg transition-all" data-tip="Gerar 10 Estilos Coffee">
                <Coffee class="w-4 h-4" />
              </button>
              <button @click="injectVintageStyles" class="p-1 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all" data-tip="Gerar 10 Estilos Vintage">
                <Camera class="w-4 h-4" />
              </button>
              <button @click="selectedTargetId = 'new'" class="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all" data-tip="Novo Preset">
                <Plus class="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div class="space-y-1.5">
            <button 
              v-if="selectedTargetId === 'new'"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
            >
              <Sparkles class="w-4 h-4" />
              <span class="text-xs font-bold">Novo Preset</span>
            </button>

            <button 
              v-for="preset in taskStyleStore.sortedStyles" :key="preset.id"
              @mouseenter="hoveredTargetId = preset.id"
              @mouseleave="hoveredTargetId = null"
              @click="selectedTargetId = preset.id"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border border-transparent group"
              :class="selectedTargetId === preset.id ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'"
            >
              <div class="w-3.5 h-3.5 rounded-full border border-black/10 dark:border-white/10 shadow-sm" :style="{ backgroundColor: preset.colors?.bgColor || '#e2e8f0' }"></div>
              <span class="text-xs font-bold truncate flex-1 text-left">{{ preset.name }}</span>
            </button>

            <div v-if="taskStyleStore.sortedStyles.length === 0 && selectedTargetId !== 'new'" class="py-4 text-center">
              <p class="text-[10px] text-slate-400 font-medium italic">Nenhum preset salvo.</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Área Principal -->
    <div class="flex flex-col h-full pb-6">
      
      <template v-if="selectedTargetId">
        <!-- Topo: Live Preview Gigante -->
        <div class="p-6 md:p-8 shrink-0 bg-slate-200/50 dark:bg-[#0f172a] rounded-3xl border border-slate-300 dark:border-slate-800/50 relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
        <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
        <p class="absolute top-4 left-5 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <CircleDot class="w-3 h-3 text-emerald-500 animate-pulse" /> Live Preview
        </p>

        <!-- Container do Card (Simula uma coluna kanban) -->
        <div class="w-full max-w-sm flex flex-col items-center justify-center relative z-10 transition-all duration-300">
          
          <!-- Mock do TaskCard -->
          <div 
            class="glass-panel w-full relative flex flex-col shadow-xl transition-all duration-300 group"
            :style="{ 
              backgroundColor: hexToRgba(previewData.colors.bgColor, settings.normalizedCardOpacity),
              minHeight: previewData.styles.taskMinHeight > 40 ? previewData.styles.taskMinHeight + 'px' : 'auto',
              maxWidth: previewData.styles.taskMaxWidth > 0 ? previewData.styles.taskMaxWidth + 'px' : 'none',
              width: previewData.styles.taskMaxWidth > 0 ? '100%' : 'auto',
              margin: previewData.styles.taskMaxWidth > 0 ? '0 auto' : '',
              padding: previewData.styles.cardPadding ? previewData.styles.cardPadding + 'px' : '16px'
            }"
          >
            <div 
              :class="[
                isSquareLayout ? 'flex-col items-start h-full flex-1 w-full gap-3' : 'items-center gap-2 w-full'
              ]" 
              class="flex justify-between"
            >
              <div 
                class="flex flex-1 min-w-0 overflow-hidden w-full"
                :class="isSquareLayout ? 'flex-col items-start gap-2' : 'items-center gap-2'"
              >
                <span 
                  class="font-bold px-2 py-1 rounded-lg leading-tight flex-shrink-0 border flex items-center justify-center gap-2 mr-2 min-w-[85px]" 
                  :style="{ 
                    backgroundColor: previewData.colors.color ? `${previewData.colors.color}26` : '', 
                    color: previewData.colors.color ? previewData.colors.color : '',
                    borderColor: previewData.colors.color ? `${previewData.colors.color}40` : 'transparent',
                    fontSize: previewData.styles.taskNumberSize + 'px'
                  }"
                  :class="[!previewData.colors.color ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 dark:bg-indigo-500/20 border-indigo-500/20' : '']"
                >
                  TSK-001
                </span>
                <span 
                  class="text-sm flex-1 min-w-0 py-0.5 leading-tight text-justify" 
                  :class="isSquareLayout ? 'line-clamp-6 mt-1 whitespace-pre-wrap' : 'line-clamp-1'"
                  :style="{ fontSize: previewData.styles.taskDescriptionSize + 'px', color: mockTextColor }"
                >
                  Um exemplo de texto descritivo alinhado de forma justificada para análise do layout.
                </span>
              </div>
              <div 
                class="flex items-center shrink-0 flex-row-reverse"
                :class="isSquareLayout ? 'w-full justify-between mt-auto pt-3 border-t border-slate-500/10' : 'ml-auto'"
                :style="!isSquareLayout ? { gap: (previewData.styles.taskTimerSize * 0.4) + 'px' } : {}"
              >
                <div 
                  class="flex items-center flex-row-reverse"
                  :style="{ gap: (previewData.styles.taskTimerSize * 0.4) + 'px' }"
                >
                  <button 
                    class="flex items-center justify-center border" 
                    :class="[
                      previewData.colors.color ? 'hover:brightness-110' : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border-indigo-500/20'
                    ]"
                    :style="{
                      width: (previewData.styles.taskTimerSize * 1.8) + 'px',
                      height: (previewData.styles.taskTimerSize * 1.8) + 'px',
                      borderRadius: (previewData.styles.taskTimerSize * 0.4) + 'px',
                      backgroundColor: previewData.colors.color ? `${previewData.colors.color}1A` : '',
                      color: previewData.colors.color ? previewData.colors.color : '',
                      borderColor: previewData.colors.color ? `${previewData.colors.color}33` : ''
                    }"
                  >
                    <Play :size="previewData.styles.taskTimerSize - 1" />
                  </button>
                  <button 
                    class="text-app-muted flex items-center justify-center hover:text-indigo-500 hover:bg-slate-500/10"
                    :style="{
                      width: (previewData.styles.taskTimerSize * 1.8) + 'px',
                      height: (previewData.styles.taskTimerSize * 1.8) + 'px',
                      borderRadius: (previewData.styles.taskTimerSize * 0.4) + 'px'
                    }"
                  >
                    <MoreVertical :size="previewData.styles.taskTimerSize" />
                  </button>
                </div>
                <span 
                  class="hidden sm:inline font-bold leading-none opacity-80"
                  :style="{ 
                    fontSize: previewData.styles.taskTimerSize + 'px', 
                    color: mockTextColor,
                    marginRight: (previewData.styles.taskTimerSize * 0.2) + 'px'
                  }"
                >
                  02:45:00
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Header da Área de Edição -->
      <div class="flex items-center justify-between py-4 mt-2">
        <div class="flex items-center gap-3 flex-1 min-w-0 pr-4">
          <div class="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl"><Layers class="w-5 h-5" /></div>
          
          <div v-if="!isEditingName" class="flex flex-col flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-black text-app-main truncate">{{ previewData.name }}</h2>
              <button v-if="selectedTargetId !== 'global'" @click="startEditName" class="text-[10px] text-indigo-500 hover:underline font-bold">Editar Nome</button>
            </div>
            <p class="text-[10px] text-app-sub">{{ selectedTargetId === 'global' ? 'As dimensões afetam todas as tarefas sem preset.' : 'Cores e dimensões exclusivas deste preset.' }}</p>
          </div>
          <div v-else class="flex items-center gap-2 flex-1 animate-fadeIn">
            <div class="flex-1">
              <AppInput v-model="editingNameValue" type="text" class="!px-3 !py-1.5 text-sm font-bold" @keyup.enter="saveName" placeholder="Nome do Preset (Ex: Urgente)..." autofocus />
            </div>
            <button @click="saveName" class="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"><CheckCircle2 class="w-4 h-4" /></button>
            <button v-if="selectedTargetId !== 'new'" @click="isEditingName = false" class="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg"><X class="w-4 h-4" /></button>
          </div>

        </div>
        <div class="flex bg-app-surface p-1 rounded-xl border border-app-border-light shrink-0 shadow-sm">
          <button @click="activeEditorTab = 'colors'" class="px-5 py-1.5 text-[11px] font-black uppercase tracking-tighter rounded-lg transition-all" :class="activeEditorTab === 'colors' ? 'bg-indigo-500 text-white shadow-md' : 'text-app-muted hover:text-indigo-500'">Cores</button>
          <button @click="activeEditorTab = 'geometry'" class="px-5 py-1.5 text-[11px] font-black uppercase tracking-tighter rounded-lg transition-all" :class="activeEditorTab === 'geometry' ? 'bg-indigo-500 text-white shadow-md' : 'text-app-muted hover:text-indigo-500'">Dimensões</button>
        </div>
      </div>

      <!-- Controles (Abaixo do Preview) -->
      <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 mt-2 border-t border-app-border-light pt-4">
        <transition name="fade-slide" mode="out-in">
          
          <!-- Aba: Cores -->
          <div v-if="activeEditorTab === 'colors'" :key="'colors'" class="space-y-6">
            <div v-if="selectedTargetId === 'global'" class="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
              <Monitor class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p class="text-[11px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-tight">O Padrão Global usa as paletas gerais do sistema</p>
                <p class="text-[10px] text-amber-600/80 mt-1">Para criar estilos com cores específicas (fundo customizado, etc), crie um <b class="underline">Novo Preset</b>.</p>
              </div>
            </div>
            
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <p class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Cor do Número (Destaque principal)</p>
                <AppColorPalette v-model="editingData.colors.color" :colors="settings.titlePalette" />
              </div>
              <div>
                <p class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Cor de Fundo</p>
                <AppColorPalette v-model="editingData.colors.bgColor" :colors="settings.bodyPalette" />
              </div>
              <div>
                <p class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Texto (Tema Claro)</p>
                <AppColorPalette v-model="editingData.colors.textLightColor" :colors="settings.textLightPalette" />
              </div>
              <div>
                <p class="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">Texto (Tema Escuro)</p>
                <AppColorPalette v-model="editingData.colors.textDarkColor" :colors="settings.textDarkPalette" />
              </div>
            </div>
          </div>

          <!-- Aba: Dimensões (Geometria) -->
          <div v-else-if="activeEditorTab === 'geometry'" :key="'geometry'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div class="glass-section p-4 space-y-4 shadow-sm border border-slate-200 dark:border-white/5">
              <div class="flex justify-between items-center"><span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Espaçamento Interno (Padding)</span><span class="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">{{ editingData.styles.cardPadding }}px</span></div>
              <input type="range" v-model.number="editingData.styles.cardPadding" min="8" max="40" step="2" class="w-full app-range" />
            </div>

            <div class="glass-section p-4 space-y-4 shadow-sm border border-slate-200 dark:border-white/5">
              <div class="flex justify-between items-center"><span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tamanho do Título</span><span class="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">{{ editingData.styles.taskNumberSize }}px</span></div>
              <input type="range" v-model.number="editingData.styles.taskNumberSize" min="8" max="24" step="1" class="w-full app-range" />
            </div>

            <div class="glass-section p-4 space-y-4 shadow-sm border border-slate-200 dark:border-white/5">
              <div class="flex justify-between items-center"><span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tamanho da Descrição</span><span class="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">{{ editingData.styles.taskDescriptionSize }}px</span></div>
              <input type="range" v-model.number="editingData.styles.taskDescriptionSize" min="8" max="28" step="1" class="w-full app-range" />
            </div>
            
            <div class="glass-section p-4 space-y-4 shadow-sm border border-slate-200 dark:border-white/5">
              <div class="flex justify-between items-center"><span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tamanho do Cronômetro</span><span class="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">{{ editingData.styles.taskTimerSize }}px</span></div>
              <input type="range" v-model.number="editingData.styles.taskTimerSize" min="8" max="24" step="1" class="w-full app-range" />
            </div>

            <div class="glass-section p-4 space-y-4 shadow-sm border border-slate-200 dark:border-white/5">
              <div class="flex justify-between items-center"><span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Altura (Min-Height)</span><span class="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">{{ editingData.styles.taskMinHeight }}px</span></div>
              <input type="range" v-model.number="editingData.styles.taskMinHeight" min="40" max="300" step="5" class="w-full app-range" />
            </div>

            <div class="glass-section p-4 space-y-4 shadow-sm border border-slate-200 dark:border-white/5">
              <div class="flex justify-between items-center"><span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Comprimento (Max-Width)</span><span class="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">{{ editingData.styles.taskMaxWidth === 0 ? 'Auto' : editingData.styles.taskMaxWidth + 'px' }}</span></div>
              <input type="range" v-model.number="editingData.styles.taskMaxWidth" min="0" max="800" step="10" class="w-full app-range" />
            </div>

          </div>

        </transition>
      </div>
      </template>

      <div v-else class="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 opacity-70">
        <Palette class="w-16 h-16 mb-4 opacity-50" />
        <h3 class="text-lg font-black tracking-tight mb-2">Nenhum Estilo Selecionado</h3>
        <p class="text-xs text-center max-w-xs">Selecione o Padrão Global, escolha um preset existente ou crie um novo estilo na lateral esquerda.</p>
      </div>

    </div>

    <!-- Footer de Ações -->
    <template #footer>
      <div class="flex items-center justify-between w-full">
        <button 
          v-if="selectedTargetId !== 'global' && selectedTargetId !== 'new'" 
          @click="handleDelete" 
          class="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
        >
          Excluir Preset
        </button>
        <div v-else></div> <!-- Placeholder para flex-between -->

        <div class="flex items-center gap-3">
          <button type="button" @click="emit('close')" class="btn btn-secondary px-6 py-2 border-none shadow-none text-xs">Fechar</button>
          
          <button 
            v-if="selectedTargetId && selectedTargetId !== 'new'" 
            type="button" 
            @click="handleDuplicate" 
            class="px-5 py-2 text-indigo-500 hover:bg-indigo-500/10 rounded-xl transition-all text-xs font-bold flex items-center gap-2"
          >
            <Copy class="w-4 h-4" /> Duplicar Preset
          </button>

          <button v-if="selectedTargetId" type="button" @click="handleSave" class="btn btn-primary px-8 py-2 border-none shadow-md text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Save class="w-4 h-4" /> Salvar Alterações
          </button>
        </div>
      </div>
    </template>

  </BaseModal>
</template>
