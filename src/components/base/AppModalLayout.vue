<script setup>
/**
 * AppModalLayout.vue - Versão Estrutural Pura (Passthrough)
 * Fornece apenas a grade flexível para Header, Sidebar, Body e Footer.
 * NÃO injeta cores ou transparências para garantir que o monitor do usuário
 * veja exatamente o que o BaseModal pai está renderizando.
 */
</script>

<template>
  <div class="flex flex-col h-full w-full bg-transparent overflow-hidden transform-gpu">
    <!-- Slot: Header (Lado a lado com o fechar) -->
    <header class="flex items-center justify-between px-6 md:px-10 py-4 border-b border-app-border-light shrink-0 select-none z-30 bg-transparent">
      <slot name="header"></slot>
    </header>

    <div class="flex flex-col md:flex-row flex-1 overflow-hidden relative">
      <!-- Slot: Sidebar (Navegação) -->
      <aside class="w-full md:w-64 border-b md:border-b-0 md:border-r border-app-border-light flex flex-col p-4 shrink-0 z-10 bg-transparent">
        <slot name="sidebar"></slot>
      </aside>

      <!-- Slot: Body (Conteúdo Principal) -->
      <main class="flex-1 flex flex-col overflow-hidden bg-transparent">
        <div class="flex-1 overflow-y-auto px-6 md:px-10 py-6 custom-scrollbar pb-24">
          <slot></slot>
        </div>

        <!-- Slot: Footer (Ações) -->
        <footer 
          v-if="$slots.footer" 
          class="absolute bottom-0 left-0 right-0 py-4 px-6 md:px-10 border-t border-app-border-light backdrop-blur-md flex justify-end items-center gap-3 shrink-0 z-20"
          style="background-color: transparent !important;"
        >
          <slot name="footer"></slot>
        </footer>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Estabilização para evitar saltos de renderização */
.transform-gpu {
  backface-visibility: hidden;
  perspective: 1000px;
}
</style>
