import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db } from '../db.js';
import { notificationService } from '../services/notificationService';

export const useNoteStore = defineStore('note', () => {
  const note = ref('');
  const isLoaded = ref(false);

  const loadNote = async () => {
    try {
      const savedNote = await db.notes.toCollection().last();
      if (savedNote) {
        note.value = savedNote.content;
      } else {
        // Create initial empty note if none exists
        await db.notes.add({ content: '', updatedAt: Date.now() });
      }
      isLoaded.value = true;
    } catch (error) {
      console.error("Failed to load note:", error);
      notificationService.toast("Erro ao carregar as notas rápidas do banco de dados.", "error");
    }
  };

  const saveNote = async (content) => {
    note.value = content;
    try {
      const lastNote = await db.notes.toCollection().last();
      if (lastNote) {
        await db.notes.update(lastNote.id, { content, updatedAt: Date.now() });
      } else {
        await db.notes.add({ content, updatedAt: Date.now() });
      }
    } catch (error) {
      console.error("Failed to save note:", error);
      notificationService.toast("Erro ao salvar as notas rápidas no banco de dados.", "error");
    }
  };

  return {
    note,
    isLoaded,
    loadNote,
    saveNote
  };
});
