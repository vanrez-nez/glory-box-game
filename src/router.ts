import { createRouter, createWebHistory } from 'vue-router';
import Home from './views/Home.vue';
import About from './views/About.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/about',
      name: 'about',
      component: About,
    },
    {
      path: '/game',
      name: 'game',
      // route level code-splitting
      // this generates a separate chunk for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/Game.vue'),
    },
    // DEV-only dragon den-entry visualizer (tree-shaken from prod builds).
    ...(import.meta.env.DEV ? [{
      path: '/dragon-debug',
      name: 'dragon-debug',
      component: () => import('./views/DragonDebug.vue'),
    }] : []),
  ],
});
