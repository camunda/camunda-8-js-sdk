import { CamundaRestClient } from '@camunda8/isomorphic-sdk'
import './App.css'
import logo from './logo.svg'

function App() {
	const camunda = new CamundaRestClient({
		config: {
			CAMUNDA_AUTH_STRATEGY: 'OAUTH',
			ZEEBE_CLIENT_ID: 'zeebe',
			ZEEBE_CLIENT_SECRET: 'zecret',
			ZEEBE_REST_ADDRESS: 'http://localhost:8080',
			CAMUNDA_OAUTH_URL:
				'http://localhost:18080/auth/realms/camunda-platform/protocol/openid-connect/token',
		},
	})
	return (
		<div className='App'>
			<header className='App-header'>
				<img src={logo} className='App-logo' alt='logo' />
				<p>
					Edit <code>src/App.tsx</code> and save to reload.
				</p>
				<a
					className='App-link'
					href='https://reactjs.org'
					target='_blank'
					rel='noopener noreferrer'
				>
					Learn React
				</a>
			</header>
		</div>
	)
}

export default App
