import 'dotenv/config'
import { createEnv } from 'neon-env'

import { _getConsoleEnv } from './console'
import { _getOperateEnv } from './operate'
import { _getOptimizeEnv } from './optimize'
import { _getTasklistEnv } from './tasklist'
import { _getZeebeEnv } from './zeebe'

let credentialsCache: ReturnType<typeof _getEnv>
let optimizeCache: ReturnType<typeof _getOptimizeEnv>
let operateCache: ReturnType<typeof _getOperateEnv>
let tasklistCache: ReturnType<typeof _getTasklistEnv>
let zeebeCache: ReturnType<typeof _getZeebeEnv>
let consoleCache: ReturnType<typeof _getConsoleEnv>

export function getCamundaCredentialsFromEnv(cache = true) {
	if (!cache) {
		return _getEnv()
	}
	if (credentialsCache === undefined) {
		credentialsCache = _getEnv()
	}
	return credentialsCache
}

export function getConsoleCredentials() {
	if (consoleCache === undefined) {
		consoleCache = _getConsoleEnv()
	}
	return consoleCache
}

export function getZeebeCredentials() {
	if (zeebeCache === undefined) {
		zeebeCache = _getZeebeEnv()
	}
	if (!zeebeCache.CAMUNDA_CREDENTIALS_SCOPES?.includes('Zeebe')) {
		throw new Error(
			`Credentials do not have required scope 'Zeebe'. Credential scopes: '${zeebeCache.CAMUNDA_CREDENTIALS_SCOPES}'`
		)
	}
	return zeebeCache
}

export function getTasklistCredentials() {
	if (tasklistCache === undefined) {
		tasklistCache = _getTasklistEnv()
	}
	if (!tasklistCache.CAMUNDA_CREDENTIALS_SCOPES?.includes('Tasklist')) {
		throw new Error(
			`Credentials do not have required scope 'Tasklist'. Credential scopes: '${tasklistCache.CAMUNDA_CREDENTIALS_SCOPES}'`
		)
	}
	return tasklistCache
}

export function getOperateCredentials() {
	if (operateCache === undefined) {
		operateCache = _getOperateEnv()
	}
	if (!operateCache.CAMUNDA_CREDENTIALS_SCOPES?.includes('Operate')) {
		throw new Error(
			`Credentials do not have required scope 'Operate'. Credential scopes: '${operateCache.CAMUNDA_CREDENTIALS_SCOPES}'`
		)
	}
	return operateCache
}

export function getOptimizeCredentials() {
	if (optimizeCache === undefined) {
		optimizeCache = _getOptimizeEnv()
	}
	if (!optimizeCache.CAMUNDA_CREDENTIALS_SCOPES?.includes('Optimize')) {
		throw new Error(
			`Credentials do not have required scope 'Optimize'. Credential scopes: '${optimizeCache.CAMUNDA_CREDENTIALS_SCOPES}'`
		)
	}
	return optimizeCache
}

function _getEnv() {
	const creds = createEnv({
		ZEEBE_ADDRESS: {
			type: 'string',
			optional: false,
		},
		ZEEBE_CLIENT_ID: {
			type: 'string',
			optional: false,
		},
		ZEEBE_CLIENT_SECRET: {
			type: 'string',
			optional: false,
		},
		ZEEBE_AUTHORIZATION_SERVER_URL: {
			type: 'string',
			optional: false,
		},
		ZEEBE_TOKEN_AUDIENCE: {
			type: 'string',
			optional: true,
		},
		CAMUNDA_CLUSTER_ID: {
			type: 'string',
			optional: false,
		},
		CAMUNDA_CLUSTER_REGION: {
			type: 'string',
			optional: false,
		},
		CAMUNDA_CREDENTIALS_SCOPES: {
			type: 'string',
			optional: false,
		},
		CAMUNDA_TASKLIST_BASE_URL: {
			type: 'string',
			optional: true,
		},
		CAMUNDA_OPTIMIZE_BASE_URL: {
			type: 'string',
			optional: true,
		},
		CAMUNDA_OPERATE_BASE_URL: {
			type: 'string',
			optional: true,
		},
		CAMUNDA_OAUTH_URL: {
			type: 'string',
			optional: false,
		},
	})
	const scopes = {
		Zeebe: creds.CAMUNDA_CREDENTIALS_SCOPES?.includes('Zeebe'),
		Tasklist: creds.CAMUNDA_CREDENTIALS_SCOPES?.includes('Tasklist'),
		Operate: creds.CAMUNDA_CREDENTIALS_SCOPES?.includes('Operate'),
		Optimize: creds.CAMUNDA_CREDENTIALS_SCOPES?.includes('Optimize'),
	}
	return {
		...creds,
		ZEEBE_ADDRESS: creds.ZEEBE_ADDRESS as string,
		ZEEBE_CLIENT_ID: creds.ZEEBE_CLIENT_ID as string,
		ZEEBE_CLIENT_SECRET: creds.ZEEBE_CLIENT_SECRET as string,
		ZEEBE_AUTHORIZATION_SERVER_URL:
			creds.ZEEBE_AUTHORIZATION_SERVER_URL as string,
		scopes,
		complete: true as const,
	}
}
