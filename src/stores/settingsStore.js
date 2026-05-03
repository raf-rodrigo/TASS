import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '../db.js';

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref('dark');
  const columns = ref(2);
  const formatText = ref(false);
  const appWidth = ref(1000);
  const gitlabUrl = ref('https://git.lliege.com.br/POCS/ci');
  const gitlabIntegrationMode = ref('link');
  const gitlabProjectId = ref('');
  const gitlabToken = ref('');
  const gitlabBaseBranch = ref('develop');
  const waterReminderEnabled = ref(false);
  const waterReminderInterval = ref(60);
  const activeSprintId = ref('all');
  const taskNumberSize = ref(12);
  const taskDescriptionSize = ref(13);
  const notesSide = ref('right');
  const noteColor = ref('#fef9c3');
  const backgroundImage = ref('');
  const backgroundBlur = ref(0);
  const notesButtonTop = ref(128);
  const notesWidth = ref(350);
  const cardPadding = ref(16);
  const fontFamily = ref('Inter');
  const trackInactivity = ref(true);
  const workStart = ref('08:00');
  const workEnd = ref('18:00');
  const workDays = ref([1, 2, 3, 4, 5]); // Seg a Sex
  const autoPauseOutsideWork = ref(false);
  const cardOpacity = ref(80);
  const cardBorderRadius = ref(16);
  const opacityTargets = ref({
    cards: true,
    topBar: true,
    bottomBar: true,
    contextMenu: true,
    actionBar: true
  });

  const customWallpapers = ref([
    { name: 'Dark Abstract', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Deep Space', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Minimal Nature', url: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Modern Scenic', url: 'https://images.unsplash.com/photo-1776811805307-a0e0289c672f?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Cozy Desk', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1920&auto=format&fit=crop' },
    { name: 'Studio Night', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1920&auto=format&fit=crop' }
  ]);

  const isInitialized = ref(false);

  // Map of localStorage keys to their ref names and default values
  const legacyKeys = {
    'app-theme': { ref: theme, type: 'string', default: 'dark' },
    'app-columns': { ref: columns, type: 'number', default: 2 },
    'app-format-text': { ref: formatText, type: 'boolean', default: false },
    'app-width': { ref: appWidth, type: 'number', default: 1000 },
    'app-task-number-size': { ref: taskNumberSize, type: 'number', default: 12 },
    'app-task-desc-size': { ref: taskDescriptionSize, type: 'number', default: 13 },
    'app-notes-side': { ref: notesSide, type: 'string', default: 'right' },
    'app-note-color': { ref: noteColor, type: 'string', default: '#fef9c3' },
    'app-bg-image': { ref: backgroundImage, type: 'string', default: '' },
    'app-bg-blur': { ref: backgroundBlur, type: 'number', default: 0 },
    'app-notes-btn-top': { ref: notesButtonTop, type: 'number', default: 128 },
    'app-notes-width': { ref: notesWidth, type: 'number', default: 350 },
    'app-card-padding': { ref: cardPadding, type: 'number', default: 16 },
    'app-font-family': { ref: fontFamily, type: 'string', default: 'Inter' },
    'app-gitlab-url': { ref: gitlabUrl, type: 'string', default: 'https://git.lliege.com.br/POCS/ci' },
    'app-gitlab-mode': { ref: gitlabIntegrationMode, type: 'string', default: 'link' },
    'app-gitlab-project-id': { ref: gitlabProjectId, type: 'string', default: '' },
    'app-gitlab-token': { ref: gitlabToken, type: 'string', default: '' },
    'app-gitlab-base-branch': { ref: gitlabBaseBranch, type: 'string', default: 'develop' },
    'app-water-enabled': { ref: waterReminderEnabled, type: 'boolean', default: false },
    'app-water-interval': { ref: waterReminderInterval, type: 'number', default: 60 },
    'app-active-sprint': { ref: activeSprintId, type: 'string', default: 'all' },
    'app-track-inactivity': { ref: trackInactivity, type: 'boolean', default: true },
    'app-work-start': { ref: workStart, type: 'string', default: '08:00' },
    'app-work-end': { ref: workEnd, type: 'string', default: '18:00' },
    'app-work-days': { ref: workDays, type: 'object', default: [1, 2, 3, 4, 5] },
    'app-auto-pause-work': { ref: autoPauseOutsideWork, type: 'boolean', default: false },
    'app-card-opacity': { ref: cardOpacity, type: 'number', default: 80 },
    'app-card-radius': { ref: cardBorderRadius, type: 'number', default: 16 },
    'app-opacity-targets': { ref: opacityTargets, type: 'object', default: { cards: true, topBar: true, bottomBar: true, contextMenu: true, actionBar: true } },
    'app-custom-wallpapers': { 
      ref: customWallpapers, 
      type: 'object', 
      default: [
        { name: 'Dark Abstract', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop' },
        { name: 'Deep Space', url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop' },
        { name: 'Minimal Nature', url: 'https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=1920&auto=format&fit=crop' },
        { name: 'Modern Scenic', url: 'https://images.unsplash.com/photo-1776811805307-a0e0289c672f?q=80&w=1920&auto=format&fit=crop' },
        { name: 'Cozy Desk', url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1920&auto=format&fit=crop' },
        { name: 'Studio Night', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1920&auto=format&fit=crop' }
      ] 
    }
  };

  const loadSettings = async () => {
    try {
      const allSettings = await db.settings.toArray();
      const settingsMap = Object.fromEntries(allSettings.map(s => [s.key, s.value]));

      const needsMigration = allSettings.length === 0;

      for (const [key, config] of Object.entries(legacyKeys)) {
        let value = settingsMap[key];

        if (needsMigration) {
          const lsValue = localStorage.getItem(key);
          if (lsValue !== null) {
            if (config.type === 'number') value = parseInt(lsValue);
            else if (config.type === 'boolean') value = lsValue === 'true';
            else if (config.type === 'object') {
              try { value = JSON.parse(lsValue); } catch(e) { value = config.default; }
            }
            else value = lsValue;
            await db.settings.put({ key, value });
          } else {
            value = config.default;
          }
        } else if (value === undefined || (key === 'app-custom-wallpapers' && Array.isArray(value) && value.length === 0)) {
          value = config.default;
        }

        config.ref.value = value;
      }
      
      isInitialized.value = true;
    } catch (error) {
      console.error("Failed to load settings from IndexedDB", error);
    }
  };

  // Função para salvar uma única configuração (usada em interações de UI diretas)
  const saveSetting = async (key, value) => {
    try {
      // Clone reactive values to avoid DataCloneError in IndexedDB
      const plainValue = JSON.parse(JSON.stringify(value));
      await db.settings.put({ key, value: plainValue });
    } catch (error) {
      console.error(`Failed to save setting ${key}`, error);
    }
  };

  // Função para salvar TODAS as configurações atuais (chamada no botão Salvar do Modal)

  const saveAllSettings = async () => {
    try {
      const promises = Object.entries(legacyKeys).map(([key, config]) => {
        const value = Array.isArray(config.ref.value) ? [...config.ref.value] : config.ref.value;
        return db.settings.put({ key, value });
      });
      await Promise.all(promises);
      console.log("All settings saved to database");
    } catch (error) {
      console.error("Failed to save all settings", error);
    }
  };

  return {
    theme,
    columns,
    formatText,
    appWidth,
    gitlabUrl,
    gitlabIntegrationMode,
    gitlabProjectId,
    gitlabToken,
    gitlabBaseBranch,
    waterReminderEnabled,
    waterReminderInterval,
    activeSprintId,
    taskNumberSize,
    taskDescriptionSize,
    notesSide,
    noteColor,
    backgroundImage,
    backgroundBlur,
    notesButtonTop,
    notesWidth,
    cardPadding,
    fontFamily,
    trackInactivity,
    workStart,
    workEnd,
    workDays,
    autoPauseOutsideWork,
    cardOpacity,
    cardBorderRadius,
    opacityTargets,
    customWallpapers,
    loadSettings,
    saveSetting,
    saveAllSettings,
    isInitialized
  };
});
