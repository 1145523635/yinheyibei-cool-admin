import axios from 'axios';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { ElMessage, ElNotification } from 'element-plus';
import { endsWith } from 'lodash-es';
import { storage } from '/@/cool/utils';
import { useBase } from '/$/base';
import { router } from '../router';
import { config, isDev } from '/@/config';

// 创建 axios 实例
const request = axios.create({
	timeout: import.meta.env.VITE_TIMEOUT, // 设置请求超时时间
	withCredentials: false, // 不携带凭证
	baseURL:'http://127.0.0.1:3000/'
});

// 配置 NProgress
NProgress.configure({
	showSpinner: true // 显示加载指示器
});

// // 请求队列，用于存储待处理的请求
// let queue: Array<(token: string) => void> = [];
//
// // 标识是否正在刷新 token
// let isRefreshing = false;

// 请求拦截器
request.interceptors.request.use(
	(req: any) => {
		const { user } = useBase(); // 获取用户信息

		if (req.url) {
			// 控制请求进度条的显示
			if (
				!config.ignore.NProgress.some(e => req.url.match(new RegExp(`${e}.*`))) &&
				(req.NProgress ?? true)
			) {
				NProgress.start();
			}
		}

		// 在开发环境中打印请求信息
		if (isDev) {
			console.group(req.url);
			console.log('method:', req.method);
			console.table('data:', req.method == 'get' ? req.params : req.data);
			console.groupEnd();
		}

		if (!req.headers) {
			req.headers = {};
		}

		// 设置请求头中的语言
		if (req.headers['language'] !== null) {
			req.headers['language'] = config.i18n.locale;
		}

		// 验证 token
		if (user.token) {
			// 设置请求头中的 Authorization
			if (req.headers['Authorization'] !== null) {
				req.headers['Authorization'] = user.token;
			}

			// 忽略特定请求
			if (['eps', 'refreshToken'].some(e => endsWith(req.url, e))) {
				return req;
			}

			// 判断 token 是否过期 后端判断
			// if (storage.isExpired('token')) {
			// 	// 判断 refreshToken 是否过期
			// 	if (storage.isExpired('refreshToken')) {
			// 		ElMessage.error('登录状态已失效，请重新登录');
			// 		user.logout();
			// 	} else {
			// 		// 如果不在刷新中，则刷新 token
			// 		if (!isRefreshing) {
			// 			isRefreshing = true;
			//
			// 			user.refreshToken()
			// 				.then(token => {
			// 					queue.forEach(cb => cb(token)); // 处理队列中的请求
			// 					queue = [];
			// 					isRefreshing = false;
			// 				})
			// 				.catch(() => {
			// 					user.logout();
			// 				});
			// 		}
			//
			// 		// 返回一个新的 Promise，等待 token 刷新完成
			// 		return new Promise(resolve => {
			// 			queue.push(token => {
			// 				if (req.headers) {
			// 					req.headers['Authorization'] = token; // 重新设置 token
			// 				}
			// 				resolve(req);
			// 			});
			// 		});
			// 	}
			// }
		}

		return req;
	},
	error => {
		return Promise.reject(error); // 请求错误处理
	}
);

// 响应拦截器
request.interceptors.response.use(
	res => {
		NProgress.done(); // 结束进度条

		if (res.data.code === 200) {
			return res.data; // 如果响应状态码为200，直接返回数据
		} else {
			handleCode(res)
		}


	},
	async error => {
		NProgress.done(); // 结束进度条

		if (error.response) {
			const { status } = error.response;
			const { user } = useBase();

			if (status == 401) {
				user.logout(); // 未授权，登出用户
			} else {
				if (!isDev) {
					switch (status) {
						case 403:
							router.push('/403'); // 禁止访问
							break;

						case 500:
							router.push('/500'); // 服务器错误
							break;

						case 502:
							router.push('/502'); // 网关错误
							break;
					}
				}
			}
		}

		return Promise.reject({ message: error.response?.data?.message || error.message }); // 返回错误信息
	}
);

//自定义异常拦截
function handleCode(response) {
	//500拦截
	if (response.data.code === 500) {
		let message = '传参错误'
		if (typeof response.data.data == 'string') {
			message = response.data.data
		}
		if (response.data.data instanceof Object) {
			if (Object.getOwnPropertyNames(response.data.data).length == 1) {
				for (let key in response.data.data) {
					message = response.data.data[key]
				}
			} else {
				message = '传参错误'
			}
		}
		ElNotification({
			type: 'error',
			title: '错误',
			message
		})
		return {
			code: 500,
			data: message
		};
	}
	//账号密码错误拦截
	if (response.data.code === 40001) {

		ElNotification({
			type: 'error',
			title: '错误',
			message: response.data.data
		})
		return {
			code: 40001,
			data: response.data.data
		}
	}
	//账号冻结
	if (response.data.code === 40002) {
		ElNotification({
			type: 'error',
			title: '错误',
			message: response.data.data
		})
		return {
			code: 40002,
			data: response.data.data
		}
	}
	//账号多点登录（跳入登录页）
	if (response.data.code === 10005) {
		ElNotification({
			type: 'error',
			title: '错误',
			message: response.data.msg
		})
		// removeToken()
		// store.commit('SET_TOKEN', null)
		// store.commit('SET_INFO', null)
		// router.replace('/')
		return {
			code: 10005,
			data: response.data.data
		}
	}
	//登录过期
	if (response.data.code === 10003) {
		ElNotification({
			type: 'error',
			title: '错误',
			message: response.data.msg
		})
		// removeToken()
		// store.commit('SET_TOKEN', null)
		// store.commit('SET_INFO', null)
		// router.replace('/')
		return {
			code: 10003,
			data: response.data.data
		}
	}
	//授权token不存在
	if (response.data.code === 10004) {
		ElNotification({
			type: 'error',
			title: '错误',
			message: response.data.msg
		})
		// removeToken()
		// store.commit('SET_TOKEN', null)
		// store.commit('SET_INFO', null)
		// LoginBox.install();
		// router.replace('/')

		return {
			code: 10004,
			data: response.data.data
		}
	}
	ElNotification({
		type: 'error',
		title: '错误',
		message: response.data.message
	})
	return {
		code: 99999,
		data: response.data.data
	}

}

export { request };
