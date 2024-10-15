import {type OAuthInterfaces} from '@camunda8/oauth'
import ky from 'ky'
import {type Query} from '../../dto/operate-dto.js'
import {
	type IsoSdkClientConfiguration,
} from '../../lib/index.js'
import {OperateApiClient} from './operate-api-client.js'

export type OperateClientOptions = {
	config?: Partial<IsoSdkClientConfiguration>;
	oAuthProvider?: OAuthInterfaces.IOAuthProvider;
	rest?: typeof ky;
}

export class TestableOperateApiClient extends OperateApiClient {
	constructor(
		{config, oAuthProvider, rest = ky}: OperateClientOptions = {},
	) {
		super({config, oAuthProvider, rest})
	}

	public override addTenantIdToFilter<T extends Query<any>>(
		query: T,
		tenantId?: string,
	) {
		return super.addTenantIdToFilter(query, tenantId)
	}
}
