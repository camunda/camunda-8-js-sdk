import { CamundaRestClient } from '@camunda8/sdk-rest'
import './App.css'
import logo from './logo.svg'
import ky from 'ky'

function App() {
	const camunda = new CamundaRestClient({
		configuration: {
			CAMUNDA_AUTH_STRATEGY: 'OAUTH',
			ZEEBE_CLIENT_ID: 'zeebe',
			ZEEBE_CLIENT_SECRET: 'zecret',
			ZEEBE_REST_ADDRESS: 'http://localhost:8080',
			CAMUNDA_OAUTH_URL:
				'http://localhost:18080/auth/realms/camunda-platform/protocol/openid-connect/token',
		},
	})

	camunda.getTopology().then((topology) => {
		console.log(topology)
	})
	
	deploy()
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

async function deploy() {
	const serverPort = 58901
	const formData = new FormData();
	const resource = {
		content: 'resource content',
		name: 'resourceName.txt',
	};

	formData.append('resources', new Blob([resource.content], { type: 'text/plain' }), resource.name);
	formData.append('tenantId', 'tenantIdValue');

	try {
		const response = await ky.post(`http://localhost:${serverPort}/deployments`, {
			body: formData,
			headers: {
				accept: 'application/json',
			},
		}).json();

		console.log(response)
	} catch (error) {
		console.error('Error sending form data:', error);
	}
}
export default App
