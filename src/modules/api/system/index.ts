import { request } from '/@/cool/service/request';

/**
 * 获取系统菜单
 * @returns token
 */
export function getMenuAll() {
	return request({
		url: 'https://show.cool-admin.com/api/admin/base/comm/permmenu',
		method: 'get'
	});
}
