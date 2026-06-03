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
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
