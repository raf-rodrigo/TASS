/**
 * TIMER1 - Web Worker para Pulso Global
 * Este arquivo roda em um thread separado da interface principal.
 */

let timerInterval = null;
let autoSaveInterval = null;

// Escuta comandos da thread principal
self.onmessage = (e) => {
  const { command } = e.data;

  if (command === 'start') {
    startTimers();
  } else if (command === 'stop') {
    stopTimers();
  }
};

function startTimers() {
  // Limpa antes de começar
  stopTimers();

  // Pulso de 1 segundo (Interface e Monitoramento)
  timerInterval = setInterval(() => {
    self.postMessage({ type: 'TICK_1S', timestamp: Date.now() });
  }, 1000);

  // Pulso de 10 segundos (Persistência no Banco)
  autoSaveInterval = setInterval(() => {
    self.postMessage({ type: 'TICK_10S', timestamp: Date.now() });
  }, 10000);
}

function stopTimers() {
  if (timerInterval) clearInterval(timerInterval);
  if (autoSaveInterval) clearInterval(autoSaveInterval);
}
