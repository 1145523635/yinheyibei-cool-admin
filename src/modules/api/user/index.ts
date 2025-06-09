import { request } from '/@/cool/service/request';

/**
 * 管理员登录
 * @returns token
 */
export function login(data: { account: string; password: string }) {
	return request({
		url: 'admin/user/login',
		method: 'post',
		data
	});
}

/**
 * 获取用户信息
 * @returns  用户需信息
 */
export function getUserInfo() {
	return request({
		url: 'admin/user/getUserInfo',
		method: 'get'
	});
}

/**
 * 用户退出登录
 * @returns  退出登录
 */
export function logout() {
	return request({
		url: 'admin/user/logout',
		method: 'post'
	});
}
