<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-6 md:p-12 overflow-y-auto custom-scrollbar">
    <div class="max-w-3xl mx-auto glass-panel p-8 md:p-12 rounded-3xl border border-app-border-light shadow-2xl relative">
      <button @click="handleClose" class="absolute top-6 right-6 md:top-8 md:right-8 text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
        <X class="w-4 h-4" /> Fechar
      </button>
      
      <h1 class="text-3xl font-black text-app-main tracking-tight mb-2 mt-8 md:mt-0">Termos de Uso</h1>
      <p class="text-sm text-app-muted font-medium mb-10">Última atualização: Junho de 2026</p>

      <div class="space-y-8 prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
        <section>
          <h2 class="text-lg font-bold text-app-main mb-3">1. Aceitação dos Termos</h2>
          <p>Ao acessar e utilizar o TASS, você concorda em cumprir e ficar vinculado a estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não deve utilizar o sistema.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-app-main mb-3">2. Descrição do Serviço</h2>
          <p>O TASS é uma ferramenta de gestão de tarefas operada primariamente de forma local (no navegador do usuário). Oferecemos funcionalidades opcionais de integração com serviços de terceiros, como o Google Drive para backups e GitLab para controle de versão, que exigem sua autorização explícita.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-app-main mb-3">3. Responsabilidade pelos Dados</h2>
          <p>Como o TASS opera de forma "Local First", a integridade, segurança e backup dos seus dados são de sua inteira responsabilidade. Nós recomendamos fortemente o uso periódico do recurso de Backup via Google Drive ou Exportação Manual (JSON) para evitar perdas acidentais de tarefas em caso de limpeza de cache do navegador.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-app-main mb-3">4. Licença MIT</h2>
          <p>O TASS é um software de código aberto distribuído sob a Licença MIT. Ele é fornecido "como está", sem garantia de qualquer tipo, expressa ou implícita. Os criadores e contribuidores não se responsabilizam por quaisquer reivindicações, danos ou outras responsabilidades resultantes do uso do software.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-app-main mb-3">5. Integrações de Terceiros</h2>
          <p>Ao conectar o TASS ao Google Drive, você concorda em seguir os Termos de Serviço do Google. O TASS age apenas como um intermediário para ler e escrever os arquivos de backup gerados pelo próprio sistema dentro da sua conta pessoal.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-app-main mb-3">6. Modificações</h2>
          <p>Reservamo-nos o direito de atualizar estes termos a qualquer momento. Quaisquer alterações estarão disponíveis nesta mesma página. O uso continuado da aplicação após modificações indica sua aceitação dos novos termos.</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { X } from 'lucide-vue-next';
import { useRouter } from 'vue-router';

const router = useRouter();

const handleClose = () => {
  if (window.history.state && window.history.state.back) {
    router.back();
  } else {
    router.replace('/');
  }
};
</script>
