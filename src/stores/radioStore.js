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
  const nowPlaying = ref({
    artist: '',
    song: '',
    cover: ''
  });

  // Singleton do elemento de Áudio nativo
  let audio = new Audio();
  audio.volume = volume.value;

  // Polling de Metadados
  let metadataInterval = null;

  const fetchMetadata = async () => {
    if (!currentRadio.value?.apiUrl || !isPlaying.value) return;

    try {
      // Usando o proxy local do nosso Node (configurado no vite.config.js ou server.js)
      const proxyUrl = `/radio-proxy?url=${encodeURIComponent(currentRadio.value.apiUrl)}`;
      const response = await fetch(proxyUrl);
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        const { artist, song, cover } = result.data;
        
        if (nowPlaying.value.song !== song || nowPlaying.value.artist !== artist) {
          nowPlaying.value = { 
            artist: artist || '', 
            song: song || '', 
            cover: cover || '' 
          };
          updateMediaMetadata();
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar metadados da rádio via proxy local:', err);
    }
  };

  const startMetadataPolling = () => {
    stopMetadataPolling();
    fetchMetadata(); // Busca imediata
    metadataInterval = setInterval(fetchMetadata, 20000); // A cada 20 segundos
  };

  const stopMetadataPolling = () => {
    if (metadataInterval) {
      clearInterval(metadataInterval);
      metadataInterval = null;
    }
  };

  // Listeners do Áudio
  audio.addEventListener('playing', () => {
    isPlaying.value = true;
    isLoading.value = false;
    startMetadataPolling();
  });

  audio.addEventListener('pause', () => {
    isPlaying.value = false;
    stopMetadataPolling();
  });

  audio.addEventListener('waiting', () => {
    isLoading.value = true;
  });

  audio.addEventListener('error', (e) => {
    isLoading.value = false;
    isPlaying.value = false;
    stopMetadataPolling();
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
      savedRadios = savedRadios.map(r => ({ ...r, stars: r.stars || 0, apiUrl: r.apiUrl || '' }));
      
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

  const updateMediaMetadata = () => {
    if ('mediaSession' in navigator && currentRadio.value) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: nowPlaying.value.song || currentRadio.value.name,
        artist: nowPlaying.value.artist || 'TASS Web Radio',
        album: nowPlaying.value.song ? currentRadio.value.name : 'Ao Vivo',
        artwork: [
          { src: nowPlaying.value.cover || '/favicon.svg', sizes: '512x512', type: nowPlaying.value.cover ? 'image/jpeg' : 'image/svg+xml' }
        ]
      });
    }
  };

  const setupMediaSessionActions = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => play());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => next());
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
      updateMediaMetadata();
      setupMediaSessionActions();
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
      // Reseta metadados ao trocar
      nowPlaying.value = { artist: '', song: '', cover: '' };
      
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

  const updateRadio = async (id, data) => {
    try {
      await db.radios.update(id, data);
      const index = radios.value.findIndex(r => r.id === id);
      if (index !== -1) {
        radios.value[index] = { ...radios.value[index], ...data };
        // Se for a rádio atual e estiver tocando, atualiza o metadata
        if (currentRadioId.value === id) {
          updateMediaMetadata();
          if (isPlaying.value) startMetadataPolling(); // Reinicia polling se a URL da API mudou
        }
      }
      notificationService.toast('Rádio atualizada!', 'success');
    } catch (err) {
      console.error('Failed to update radio', err);
      notificationService.toast('Erro ao atualizar rádio.', 'error');
    }
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
    nowPlaying,
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
    updateRadio,
    deleteRadio,
    rateRadio
  };
});
