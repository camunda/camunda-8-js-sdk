import { IOAuthProvider } from 'oauth'

import { CamundaPlatform8Configuration } from './Configuration'

export interface ClientConstructor {
	config?: Partial<CamundaPlatform8Configuration>
	oAuthProvider?: IOAuthProvider
}
