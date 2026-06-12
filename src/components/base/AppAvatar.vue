<script setup>
defineProps({
  src: String,
  name: String,
  size: {
    type: String,
    default: 'md'
  },
  border: {
    type: Boolean,
    default: true
  }
});

const sizes = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-14 h-14 text-sm',
  xl: 'w-20 h-20 text-lg',
};

const getInitials = (name) => {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
};
</script>

<template>
  <div 
    class="relative inline-flex items-center justify-center rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-app-border-light"
    :class="[sizes[size], border ? 'border' : '']"
  >
    <img 
      v-if="src" 
      :src="src" 
      class="w-full h-full object-cover transition-transform hover:scale-110 duration-500" 
      :alt="name" 
    />
    <span v-else class="font-black text-indigo-500 select-none">
      {{ getInitials(name) }}
    </span>
  </div>
</template>
