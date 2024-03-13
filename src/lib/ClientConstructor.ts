import { IOAuthProvider } from 'oauth'

import { CamundaPlatform8Configuration } from './Configurator'

export interface ClientConstructor {
	config?: Partial<CamundaPlatform8Configuration>
	oAuthProvider?: IOAuthProvider
}
