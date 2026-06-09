import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router';
import store from '@/store';
import resize from '@/directives/resize';

// Global styles
import 'sanitize.css';
import '@styles/vars.css';
import '@styles/common.css';

const app = createApp(App);

// VUE DIRECTIVES
app.directive('resize', resize);

app.use(router);
app.use(store);
app.mount('#app');
