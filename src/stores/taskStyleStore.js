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
    } finally {
      isLoading.value = false;
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
        notificationService.toast('Estilo de tarefa atualizado!', 'success');
      } else {
        await db.taskStyles.add(cleanData);
        styles.value.push(cleanData);
        notificationService.toast('Estilo de tarefa criado!', 'success');
      }
    } catch (error) {
      console.error("Failed to save task style:", error);
      notificationService.toast('Erro ao salvar estilo', 'error');
      throw error;
    }
  };

  const deleteStyle = async (id) => {
    try {
      await db.taskStyles.delete(id);
      styles.value = styles.value.filter(s => s.id !== id);
      notificationService.toast('Estilo de tarefa excluído', 'success');
    } catch (error) {
      console.error("Failed to delete task style:", error);
      notificationService.toast('Erro ao excluir estilo', 'error');
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
    getStyleById
  };
});
