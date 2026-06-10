import { createRouter, createWebHistory } from 'vue-router';
import Workspace from '../views/Workspace.vue';

const routes = [
  {
    path: '/',
    name: 'Workspace',
    component: Workspace
  },
  {
    path: '/components',
    name: 'ComponentSuite',
    component: () => import('../views/ComponentSuite.vue')
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('../views/Privacy.vue')
  },
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('../views/Terms.vue')
  },
  {
    path: '/lab-card',
    name: 'LabCard',
    component: () => import('../views/LabCard.vue')
  }
];

import { useUIStore } from '../stores/uiStore';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from) => {
  try {
    const uiStore = useUIStore();
    if (uiStore.hasOpenModal()) {
      uiStore.closeAll();
      if (to.name === 'Privacy' || to.name === 'Terms') {
        return true;
      }
      return false;
    }
  } catch (e) {
    // Evita erros se o Pinia não estiver inicializado na primeira carga de rota estática
    console.warn("Roteador: Pinia ainda não disponível para o guard de modais", e);
  }
  return true;
});

export default router;
