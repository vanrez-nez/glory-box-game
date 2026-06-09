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
      path: '/game/:quality',
      name: 'game',
      // route level code-splitting
      // this generates a separate chunk for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('./views/Game.vue'),
      beforeEnter: (to, from, next) => {
        const { quality } = to.params;
        // validate only valid qualities
        if (['low', 'medium', 'high'].indexOf(quality as string) > -1) {
          next();
        } else {
          next('/');
        }
      },
    },
  ],
});
