import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db';
import { notificationService } from '../services/notificationService';

export const useRadioStore = defineStore('radio', () => {
  const radios = ref([]);
  const currentRadioId = ref(null);
  const isPlaying = ref(false);
  const volume = ref(0.5);
  const isLoading = ref(false);

  // Singleton do elemento de Áudio nativo
  let audio = new Audio();
  audio.volume = volume.value;

  // Listeners do Áudio
  audio.addEventListener('playing', () => {
    isPlaying.value = true;
    isLoading.value = false;
  });

  audio.addEventListener('pause', () => {
    isPlaying.value = false;
  });

  audio.addEventListener('waiting', () => {
    isLoading.value = true;
  });

  audio.addEventListener('error', (e) => {
    isLoading.value = false;
    isPlaying.value = false;
    notificationService.toast('Erro ao carregar stream de áudio.', 'error');
  });

  const currentRadio = computed(() => radios.value.find(r => r.id === currentRadioId.value) || radios.value[0] || null);


  const init = async () => {
    try {
      if (!db.radios) {
        console.warn('Tabela radios não encontrada. Pressione F5 para atualizar o banco de dados.');
        notificationService.toast('Atualize a página (F5) para ativar a Rádio.', 'warning');
        return;
      }
      
      // Remove qualquer rádio do sistema que tenha ficado da versão anterior
      try {
        const defaults = await db.radios.filter(r => r.isDefault === 1 || r.isDefault === true).toArray();
        if (defaults.length > 0) {
          await db.radios.bulkDelete(defaults.map(r => r.id));
        }
      } catch (e) {
        console.warn('Erro ao limpar rádios padrão:', e);
      }
      
      let savedRadios = await db.radios.toArray();
      // Garante que todas as rádios tenham a propriedade stars (migração)
      savedRadios = savedRadios.map(r => ({ ...r, stars: r.stars || 0 }));
      
      // Ordena decrescente por estrelas
      savedRadios.sort((a, b) => b.stars - a.stars);
      
      radios.value = savedRadios;
      if (radios.value.length > 0 && !currentRadioId.value) {
        currentRadioId.value = radios.value[0].id;
      }

      // Recupera volume salvo e última estação, se desejar
      const savedVol = localStorage.getItem('app-radio-volume');
      if (savedVol) {
        setVolume(parseFloat(savedVol));
      }
    } catch (err) {
      console.error('Erro ao inicializar radioStore:', err);
      notificationService.toast('Erro na rádio. Tente dar F5 na página.', 'error');
    }
  };

  const play = async () => {
    if (!currentRadio.value) return;
    
    // Se a URL mudou ou o audio não tem src, defina o src
    if (audio.src !== currentRadio.value.url) {
      audio.src = currentRadio.value.url;
    }
    
    try {
      isLoading.value = true;
      await audio.play();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Reprodução interrompida: usuário trocou de rádio rápido demais (comportamento esperado).');
      } else {
        console.error('Playback failed', error);
        notificationService.toast('Não foi possível iniciar o áudio.', 'error');
        isLoading.value = false;
      }
    }
  };

  const pause = () => {
    audio.pause();
  };

  const toggle = () => {
    if (isPlaying.value) pause();
    else play();
  };

  const setVolume = (val) => {
    volume.value = val;
    audio.volume = val;
    localStorage.setItem('app-radio-volume', val.toString());
  };

  const changeStation = (id) => {
    const radio = radios.value.find(r => r.id === id);
    if (radio) {
      currentRadioId.value = id;
      if (isPlaying.value) {
        play(); // Toca a nova URL imediatamente
      } else {
        audio.src = radio.url; // Apenas prepara o source
      }
    }
  };

  const next = () => {
    if (radios.value.length === 0) return;
    const currentIndex = radios.value.findIndex(r => r.id === currentRadioId.value);
    const nextIdx = (currentIndex + 1) % radios.value.length;
    changeStation(radios.value[nextIdx].id);
  };

  const prev = () => {
    if (radios.value.length === 0) return;
    const currentIndex = radios.value.findIndex(r => r.id === currentRadioId.value);
    const prevIdx = (currentIndex - 1 + radios.value.length) % radios.value.length;
    changeStation(radios.value[prevIdx].id);
  };

  const rateRadio = async (id, stars) => {
    try {
      await db.radios.update(id, { stars });
      const radio = radios.value.find(r => r.id === id);
      if (radio) {
        radio.stars = stars;
        // Reordena a lista reativamente
        radios.value.sort((a, b) => b.stars - a.stars);
      }
    } catch (err) {
      console.error('Failed to rate radio', err);
    }
  };

  const addRadio = async (radio) => {
    const id = await db.radios.add({ ...radio, isDefault: 0, stars: 0 });
    const newRadio = { ...radio, id, isDefault: 0, stars: 0 };
    radios.value.push(newRadio);
    radios.value.sort((a, b) => b.stars - a.stars);
    notificationService.toast('Rádio adicionada com sucesso!', 'success');
  };

  const deleteRadio = async (id) => {
    await db.radios.delete(id);
    radios.value = radios.value.filter(r => r.id !== id);
    
    // Se apagou a rádio que estava tocando, pausa e foca na primeira.
    if (currentRadioId.value === id) {
       pause();
       if (radios.value.length > 0) {
         currentRadioId.value = radios.value[0].id;
         audio.src = radios.value[0].url;
       } else {
         currentRadioId.value = null;
       }
    }
    notificationService.toast('Rádio excluída.', 'success');
  };

  return {
    radios,
    currentRadio,
    currentRadioId,
    isPlaying,
    isLoading,
    volume,
    init,
    play,
    pause,
    toggle,
    setVolume,
    changeStation,
    next,
    prev,
    addRadio,
    deleteRadio,
    rateRadio
  };
});
