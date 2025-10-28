import { CamundaRestClient } from '../src/c8/lib/CamundaRestClient'

const camunda = new CamundaRestClient()

async function main() {
	console.log(await camunda.getTopology())
}

main()
