import { ClientConstructor } from 'lib'

import { OperateApiClient } from './OperateApiClient'
import { Query } from './OperateDto'

export class TestableOperateApiClient extends OperateApiClient {
	constructor(options?: ClientConstructor) {
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
