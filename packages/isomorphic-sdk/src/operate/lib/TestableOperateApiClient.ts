import { OAuthTypes } from '@camunda8/oauth'
import ky from 'ky'

import { Query } from '../../dto/OperateDto'
import { IsoSdkConfiguration } from '../../lib'

import { OperateApiClient } from './OperateApiClient'

export class TestableOperateApiClient extends OperateApiClient {
	constructor(
		options: {
			config?: Partial<IsoSdkConfiguration>
			oAuthProvider?: OAuthTypes.IOAuthProvider
			fetch: typeof ky
		} = { fetch: ky }
	) {
		super(options)
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	public override addTenantIdToFilter<T extends Query<any>>(
		query: T,
		tenantId?: string
	) {
		return super.addTenantIdToFilter(query, tenantId)
	}
}
