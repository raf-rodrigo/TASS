import { createRouter, createWebHistory } from 'vue-router';
import Workspace from '../views/Workspace.vue';

const routes = [
  {
    path: '/',
    name: 'Workspace',
    component: Workspace,
    meta: { layout: 'MainLayout' }
  },
  {
    path: '/components',
    name: 'ComponentSuite',
    component: () => import('../views/ComponentSuite.vue'),
    meta: { layout: 'CleanLayout' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
