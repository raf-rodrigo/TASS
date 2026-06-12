<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-6 md:p-12 overflow-y-auto custom-scrollbar">
    <div class="max-w-3xl mx-auto glass-panel p-8 md:p-12 rounded-3xl border border-app-border-light shadow-2xl relative">
      <button @click="handleClose" class="absolute top-6 right-6 md:top-8 md:right-8 text-slate-400 hover:text-rose-500 transition-colors flex items-center gap-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
        <X class="w-4 h-4" /> Fechar
      </button>
      
      <h1 class="text-3xl font-black text-app-main tracking-tight mb-2 mt-8 md:mt-0">Política de Privacidade</h1>
      <p class="text-sm text-app-muted font-medium mb-10">Última atualização: Junho de 2026</p>

      <div class="space-y-8 prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
        <section>
          <h2 class="text-lg font-bold text-app-main mb-3">1. Introdução</h2>
          <p>Bem-vindo ao TASS. Nós valorizamos sua privacidade e construímos nosso sistema sob a filosofia "Local First". Isso significa que, por padrão, seus dados pertencem a você e ficam armazenados no seu próprio dispositivo.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-app-main mb-3">2. Dados Coletados e Uso da API do Google Drive</h2>
          <p>O TASS oferece a funcionalidade opcional de salvar backups das suas tarefas no seu próprio Google Drive. Ao utilizar a opção "Fazer Login com Google", nós solicitamos os seguintes acessos:</p>
          <ul class="list-disc pl-5 mt-2 space-y-2 text-app-sub">
            <li><strong>Perfil Básico e E-mail:</strong> Utilizado exclusivamente para exibir seu nome e foto no aplicativo, confirmando que você está logado.</li>
            <li><strong>Acesso a Arquivos do Google Drive (drive.file):</strong> O TASS solicita acesso <strong>apenas</strong> aos arquivos que ele mesmo cria. Nós utilizamos essa permissão estritamente para gerar um arquivo <code>.json</code> de backup e para ler esse mesmo arquivo caso você precise restaurá-lo.</li>
          </ul>
        </section>

        <section>
          <h2 class="text-lg font-bold text-app-main mb-3">3. Onde seus dados são armazenados?</h2>
          <p>O TASS <strong>não possui banco de dados centralizado ou servidores em nuvem próprios</strong>. Suas tarefas são armazenadas localmente no seu navegador (IndexedDB). Quando você ativa o backup, os dados são enviados diretamente do seu navegador para a sua conta do Google Drive. Nenhum dado de tarefa transita ou é armazenado em servidores de terceiros operados por nós.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-app-main mb-3">4. Compartilhamento de Dados</h2>
          <p><strong>Nós não vendemos, alugamos ou compartilhamos</strong> suas informações pessoais, tarefas ou qualquer conteúdo do seu Google Drive com terceiros, empresas de publicidade ou ferramentas de análise de dados. O escopo do Google Drive é usado para uso exclusivo do usuário.</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-app-main mb-3">5. Uso Limitado (Google API Services User Data Policy)</h2>
          <p>O uso das informações recebidas pelas APIs do Google pelo TASS, bem como as transferências dessas informações para qualquer outro aplicativo, estarão em estrita conformidade com a <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" class="text-indigo-500 hover:underline">Google API Services User Data Policy</a>, incluindo os requisitos de "Uso Limitado" (Limited Use).</p>
        </section>

        <section>
          <h2 class="text-lg font-bold text-app-main mb-3">6. Contato</h2>
          <p>Caso tenha dúvidas sobre como lidamos com seus dados, sinta-se livre para nos contatar através das nossas plataformas oficiais (GitHub ou WhatsApp) fornecidas na interface do aplicativo.</p>
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
