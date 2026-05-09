import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '../db';
import { notificationService } from '../services/notificationService';

export const useRadioStore = defineStore('radio', () => {
  const radios = ref([]);
  const currentRadioIndex = ref(0);
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

  const currentRadio = computed(() => radios.value[currentRadioIndex.value] || null);

  const defaultRadios = [
    { name: 'Lofi Vibes', url: 'https://streams.ilovemusic.de/iloveradio17.mp3', isDefault: 1 },
    { name: 'Synthwave / Retro', url: 'https://streams.ilovemusic.de/iloveradio26.mp3', isDefault: 1 },
    { name: 'Chillout Lounge', url: 'https://streams.ilovemusic.de/iloveradio10.mp3', isDefault: 1 },
  ];

  const init = async () => {
    try {
      if (!db.radios) {
        console.warn('Tabela radios não encontrada. Pressione F5 para atualizar o banco de dados.');
        notificationService.toast('Atualize a página (F5) para ativar a Rádio.', 'warning');
        return;
      }
      
      let savedRadios = await db.radios.toArray();
      
      if (savedRadios.length === 0) {
        await db.radios.bulkAdd(defaultRadios);
        savedRadios = await db.radios.toArray();
      }
      
      radios.value = savedRadios;

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

  const changeStation = (index) => {
    if (index >= 0 && index < radios.value.length) {
      currentRadioIndex.value = index;
      if (isPlaying.value) {
        play(); // Toca a nova URL imediatamente
      } else {
        audio.src = radios.value[index].url; // Apenas prepara o source
      }
    }
  };

  const next = () => {
    const nextIdx = (currentRadioIndex.value + 1) % radios.value.length;
    changeStation(nextIdx);
  };

  const prev = () => {
    const prevIdx = (currentRadioIndex.value - 1 + radios.value.length) % radios.value.length;
    changeStation(prevIdx);
  };

  const addRadio = async (radio) => {
    const id = await db.radios.add({ ...radio, isDefault: 0 });
    const newRadio = { ...radio, id, isDefault: 0 };
    radios.value.push(newRadio);
    notificationService.toast('Rádio adicionada com sucesso!', 'success');
  };

  const deleteRadio = async (id) => {
    await db.radios.delete(id);
    radios.value = radios.value.filter(r => r.id !== id);
    if (currentRadioIndex.value >= radios.value.length) {
      currentRadioIndex.value = Math.max(0, radios.value.length - 1);
    }
    // Se apagou a rádio que estava tocando, pausa.
    if (currentRadio.value && currentRadio.value.id === id) {
       pause();
       audio.src = currentRadio.value.url;
    }
    notificationService.toast('Rádio excluída.', 'success');
  };

  return {
    radios,
    currentRadio,
    currentRadioIndex,
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
    deleteRadio
  };
});
