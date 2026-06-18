<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../db.js';
import { notificationService } from '../services/notificationService';
import { Sparkles, User, Lock, ArrowRight, Eye, EyeOff } from 'lucide-vue-next';

const router = useRouter();

const isLogin = ref(true);
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const isLoading = ref(false);

const toggleMode = () => {
  isLogin.value = !isLogin.value;
  username.value = '';
  password.value = '';
};

const handleAuth = async () => {
  if (!username.value.trim() || !password.value.trim()) {
    notificationService.toast('Preencha todos os campos.', 'warning');
    return;
  }

  isLoading.value = true;
  try {
    if (isLogin.value) {
      await db.auth.login(username.value, password.value);
      notificationService.toast('Login realizado com sucesso!', 'success');
      router.push('/');
    } else {
      await db.auth.register(username.value, password.value);
      notificationService.toast('Cadastro realizado! Faça login agora.', 'success');
      isLogin.value = true;
      password.value = '';
    }
  } catch (err) {
    notificationService.toast(err.message || 'Falha na autenticação.', 'error');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="fixed inset-0 w-full h-full flex items-center justify-center bg-[#090a0f] text-slate-100 overflow-hidden font-sans select-none">
    <!-- Efeitos de Brilho no Background (Neon Glow) -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/15 rounded-full filter blur-[100px] pointer-events-none animate-pulse"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full filter blur-[100px] pointer-events-none animate-pulse"></div>
    
    <!-- Container Principal (Card de Vidro) -->
    <div 
      class="w-[90vw] sm:w-[420px] p-8 rounded-[24px] border border-white/10 glass-panel shadow-[0_8px_32px_rgba(0,0,0,0.37)] relative z-10 flex flex-col gap-6"
      style="background-color: rgba(15, 17, 26, 0.65); backdrop-filter: blur(20px);"
    >
      <!-- Cabeçalho / Logo -->
      <div class="flex flex-col items-center gap-2 text-center">
        <div class="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)] mb-1">
          <Sparkles class="w-8 h-8" />
        </div>
        <h1 class="text-3xl font-black tracking-widest text-white uppercase">TASS</h1>
        <p class="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-black">Productivity Dashboard</p>
        <h2 class="text-lg font-bold text-slate-200 mt-4">
          {{ isLogin ? 'Bem-vindo de volta' : 'Crie sua conta' }}
        </h2>
        <p class="text-xs text-slate-400">
          {{ isLogin ? 'Entre para gerenciar suas atividades' : 'Preencha os dados abaixo para se registrar' }}
        </p>
      </div>

      <!-- Formulário -->
      <form @submit.prevent="handleAuth" class="flex flex-col gap-4">
        <!-- Usuário -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</label>
          <div class="relative w-full flex items-center">
            <span class="absolute left-4 text-slate-400">
              <User class="w-4 h-4" />
            </span>
            <input 
              type="text" 
              v-model="username"
              placeholder="Digite seu usuário" 
              required
              class="w-full pl-11 pr-4 py-3 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] border border-white/10 focus:border-indigo-500/50 rounded-xl text-sm outline-none transition-all placeholder-slate-500"
            />
          </div>
        </div>

        <!-- Senha -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
          <div class="relative w-full flex items-center">
            <span class="absolute left-4 text-slate-400">
              <Lock class="w-4 h-4" />
            </span>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              v-model="password"
              placeholder="Digite sua senha" 
              required
              class="w-full pl-11 pr-11 py-3 bg-white/[0.03] hover:bg-white/[0.05] focus:bg-white/[0.06] border border-white/10 focus:border-indigo-500/50 rounded-xl text-sm outline-none transition-all placeholder-slate-500"
            />
            <button 
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Botão de Ação -->
        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:scale-[0.98] active:scale-[0.97] rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{{ isLogin ? 'Entrar' : 'Cadastrar' }}</span>
          <ArrowRight class="w-4 h-4" />
        </button>
      </form>

      <!-- Divisor e Alternador -->
      <div class="flex flex-col items-center gap-3 mt-2 pt-4 border-t border-white/5">
        <button 
          type="button" 
          @click="toggleMode"
          class="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition-colors cursor-pointer"
        >
          {{ isLogin ? 'Criar uma nova conta' : 'Já possui conta? Faça Login' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}
</style>
