import Vue from 'vue';
import Buefy from 'buefy';
import store from './store';
import App from './App.vue';

Vue.config.productionTip = false;

Vue.use(Buefy, {
  defaultIconPack: 'fas',
});

new Vue({
  store,
  render: (h) : any => h(App),
}).$mount('#app');
