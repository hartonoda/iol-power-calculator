import { createRouter, createWebHashHistory } from 'vue-router';
import OperationsPage from './pages/OperationsPage.vue';

const routes = [
  {
    path: '/',
    name: 'Operations',
    component: OperationsPage
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
