import { IHeadersProvider } from '../oauth'

import { CamundaPlatform8Configuration, DeepPartial } from './Configuration'

export interface ClientConstructor {
	config?: DeepPartial<CamundaPlatform8Configuration>
	oAuthProvider?: IHeadersProvider
}
