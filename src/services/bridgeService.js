import { ref } from 'vue';

const isServerOnline = ref(false);
const serverVersion = ref('');
const checkInterval = 10000; // 10 segundos
let intervalId = null;

/**
 * bridgeService
 * Gerencia o monitoramento da conexão com o backend (server.js na porta 5176).
 */
export const bridgeService = {
  isServerOnline,
  serverVersion,

  /**
   * Executa uma chamada de saúde ao backend.
   */
  async checkStatus() {
    try {
      const response = await fetch('http://localhost:5176/api/health', {
        // Aborta após 3 segundos para evitar esperas longas em caso de offline
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        isServerOnline.value = true;
        serverVersion.value = data.version || '1.0.5';
      } else {
        isServerOnline.value = false;
      }
    } catch (error) {
      isServerOnline.value = false;
    }
  },

  /**
   * Inicia o polling periódico.
   */
  startPolling() {
    this.checkStatus(); // Execução imediata na primeira carga
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => this.checkStatus(), checkInterval);
  },

  /**
   * Para o polling.
   */
  stopPolling() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },

  /**
   * Executa um comando no terminal do backend.
   */
  async executeTerminalCommand(command, cwd) {
    try {
      const response = await fetch('http://localhost:5176/api/terminal/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TASS-Client': 'true'
        },
        body: JSON.stringify({ command, cwd })
      });
      if (!response.ok) {
        throw new Error(`Erro no servidor: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      return {
        stdout: '',
        stderr: error.message || 'Falha ao conectar com o servidor.',
        cwd: cwd,
        code: -1,
        error: error.message
      };
    }
  },

  /**
   * Obtém informações do terminal do backend.
   */
  async getTerminalInfo() {
    try {
      const response = await fetch('http://localhost:5176/api/terminal/info', {
        headers: {
          'X-TASS-Client': 'true'
        }
      });
      if (response.ok) {
        return await response.json();
      }
      throw new Error(`Erro ao obter informações do terminal: ${response.status}`);
    } catch (error) {
      console.error('Falha ao obter informações do terminal:', error);
      return { cwd: '' };
    }
  }
};
