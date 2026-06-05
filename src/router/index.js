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

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
