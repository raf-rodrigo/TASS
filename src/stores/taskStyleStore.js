import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db.js';
import { notificationService } from '../services/notificationService';
import { useSettingsStore } from './settingsStore';

export const useTaskStyleStore = defineStore('taskStyle', () => {
  const styles = ref([]);
  const isLoading = ref(false);

  const sortedStyles = computed(() => {
    return [...styles.value].sort((a, b) => a.name.localeCompare(b.name));
  });

  const loadStyles = async () => {
    isLoading.value = true;
    try {
      const dbStyles = await db.taskStyles.toArray();
      
      // Migração de perfis de estilo antigos (apenas dimensões) para a nova tabela
      const settings = useSettingsStore();
      if (dbStyles.length === 0 && settings.taskStyleProfiles && settings.taskStyleProfiles.length > 0) {
        console.log("Migrando perfis antigos para nova tabela taskStyles...");
        const migratedStyles = settings.taskStyleProfiles.map(p => ({
          id: p.id,
          name: p.name,
          styles: p.styles,
          colors: {
            color: '',
            bgColor: '',
            textLightColor: '',
            textDarkColor: ''
          }
        }));
        
        await db.taskStyles.bulkAdd(migratedStyles);
        styles.value = migratedStyles;
        
        // Remove old styles from settings to avoid remigrating
        settings.taskStyleProfiles = [];
        await settings.saveSetting('app-task-style-profiles', []);
      } else {
        styles.value = dbStyles;
      }
    } catch (error) {
      console.error("Failed to load task styles:", error);
      notificationService.toast("Erro ao carregar os estilos de tarefas do banco de dados.", "error");
    } finally {
      isLoading.value = false;
    }
  };

  const restoreDefaultStyles = async (silent = false) => {
    try {
      const preloadStyles = [
        {
          id: 'style_laser_lemon',
          name: 'Laser Lemon',
          styles: {
            cardPadding: 16,
            taskNumberSize: 12,
            taskDescriptionSize: 14,
            taskTimerSize: 14,
            taskMinHeight: 100,
            taskMaxWidth: 0,
            taskVerticalAlign: 'center'
          },
          colors: {
            color: '#EAF85A',
            bgColor: '#1B1C15',
            textLightColor: '#FFFFFF',
            textDarkColor: '#EAF85A'
          }
        },
        {
          id: 'style_radioactive',
          name: 'Radioactive',
          styles: {
            cardPadding: 16,
            taskNumberSize: 12,
            taskDescriptionSize: 14,
            taskTimerSize: 14,
            taskMinHeight: 100,
            taskMaxWidth: 0,
            taskVerticalAlign: 'center'
          },
          colors: {
            color: '#1FF064',
            bgColor: '#151F17',
            textLightColor: '#FFFFFF',
            textDarkColor: '#1FF064'
          }
        }
      ];
      
      // Encontrar os que não existem para adicionar
      const existingIds = styles.value.map(s => s.id);
      const newStyles = preloadStyles.filter(s => !existingIds.includes(s.id));
      
      // Encontrar presets existentes que estão com 'styles' vazio para atualizar (correção de bug)
      const emptyStyles = preloadStyles.filter(p => {
        const existing = styles.value.find(s => s.id === p.id);
        return existing && Object.keys(existing.styles || {}).length === 0;
      });
      
      let modified = false;

      if (newStyles.length > 0) {
        await db.taskStyles.bulkAdd(newStyles);
        styles.value.push(...newStyles);
        modified = true;
      }
      
      if (emptyStyles.length > 0) {
        for (const empty of emptyStyles) {
          await db.taskStyles.update(empty.id, empty);
          const index = styles.value.findIndex(s => s.id === empty.id);
          if (index !== -1) styles.value[index] = empty;
        }
        modified = true;
      }

      if (modified) {
        if (!silent) notificationService.toast('Presets restaurados com sucesso!', 'success');
      } else {
        if (!silent) notificationService.toast('Os presets padrões já existem e estão completos.', 'info');
      }
    } catch (error) {
      console.error("Failed to restore default styles:", error);
      if (!silent) notificationService.toast('Erro ao restaurar os presets padrões das tarefas.', 'error');
    }
  };

  const saveStyle = async (styleData) => {
    try {
      const isExisting = styles.value.some(s => s.id === styleData.id);
      
      const cleanData = JSON.parse(JSON.stringify(styleData));
      
      if (isExisting) {
        await db.taskStyles.update(styleData.id, cleanData);
        const index = styles.value.findIndex(s => s.id === styleData.id);
        if (index !== -1) {
          styles.value[index] = cleanData;
        }
      } else {
        await db.taskStyles.add(cleanData);
        styles.value.push(cleanData);
      }
    } catch (error) {
      console.error("Failed to save task style:", error);
      notificationService.toast('Erro ao salvar o estilo customizado no banco de dados.', 'error');
      throw error;
    }
  };

  const deleteStyle = async (id) => {
    try {
      await db.taskStyles.delete(id);
      styles.value = styles.value.filter(s => s.id !== id);
    } catch (error) {
      console.error("Failed to delete task style:", error);
      notificationService.toast('Erro ao excluir o estilo customizado do banco de dados.', 'error');
    }
  };

  const getStyleById = (id) => {
    return styles.value.find(s => s.id === id) || null;
  };

  return {
    styles,
    sortedStyles,
    isLoading,
    loadStyles,
    saveStyle,
    deleteStyle,
    getStyleById,
    restoreDefaultStyles
  };
});
