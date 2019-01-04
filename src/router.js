import Vue from 'vue';
import Router from 'vue-router';
import Home from './views/home';
import About from './views/about';

Vue.use(Router);

export default new Router({
  mode: 'history',
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
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "game" */ './views/game'),
      beforeEnter: (to, from, next) => {
        const { quality } = to.params;
        // validate only valid qualities
        if (['low', 'medium', 'high'].indexOf(quality) > -1) {
          next();
        } else {
          next('/');
        }
      },
    },
  ],
});
