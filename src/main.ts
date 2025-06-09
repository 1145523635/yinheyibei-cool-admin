import { createApp } from 'vue';
import App from './App.vue';
import { bootstrap } from './cool';

const app = createApp(App);

// 挂载md5加密
import md5 from 'js-md5';
app.config.globalProperties.$md5 = md5

// 启动
bootstrap(app)
	.then(() => {
		app.mount('#app');
	})
	.catch(err => {
		console.error('COOL-ADMIN 启动失败', err);
	});
