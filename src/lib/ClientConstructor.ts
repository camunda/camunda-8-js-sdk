import { IHeadersProvider } from '../oauth'

import { CamundaConfigurationInput } from './Configuration'

export interface ClientConstructor {
	config?: CamundaConfigurationInput
	oAuthProvider?: IHeadersProvider
}
