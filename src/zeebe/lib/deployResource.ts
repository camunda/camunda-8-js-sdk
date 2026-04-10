import { readFileSync } from 'fs'

export type Resource =
	| { name: string; process: Buffer; tenantId?: string }
	| { processFilename: string; tenantId?: string }
	| { name: string; decision: Buffer; tenantId?: string }
	| { decisionFilename: string; tenantId?: string }
	| { name: string; form: Buffer; tenantId?: string }
	| { formFilename: string; tenantId?: string }

const isProcess = (
	maybeProcess: any // eslint-disable-line @typescript-eslint/no-explicit-any
): maybeProcess is { process: Buffer; name: string } => !!maybeProcess.process
const isProcessFilename = (
	maybeProcessFilename: any // eslint-disable-line @typescript-eslint/no-explicit-any
): maybeProcessFilename is { processFilename: string } =>
	!!maybeProcessFilename.processFilename
const isDecision = (
	maybeDecision: any // eslint-disable-line @typescript-eslint/no-explicit-any
): maybeDecision is { decision: Buffer; name: string } =>
	!!maybeDecision.decision
const isDecisionFilename = (
	maybeDecisionFilename: any // eslint-disable-line @typescript-eslint/no-explicit-any
): maybeDecisionFilename is { decisionFilename: string } =>
	!!maybeDecisionFilename.decisionFilename
// default fall-through
/* const isForm = ( maybeForm: any ): maybeForm is { form: Buffer; name: string } =>
		!!maybeForm.form
		*/
const isFormFilename = (
	maybeFormFilename: any // eslint-disable-line @typescript-eslint/no-explicit-any
): maybeFormFilename is { formFilename: string } =>
	!!maybeFormFilename.formFilename

export function getResourceContentAndName(resource: Resource): {
	content: Buffer
	name: string
} {
	if (isProcessFilename(resource)) {
		const filename = resource.processFilename
		const process = readFileSync(filename)
		return { content: process, name: filename }
	} else if (isProcess(resource)) {
		return { content: resource.process, name: resource.name }
	} else if (isDecisionFilename(resource)) {
		const filename = resource.decisionFilename
		const decision = readFileSync(filename)
		return { content: decision, name: filename }
	} else if (isDecision(resource)) {
		return { content: resource.decision, name: resource.name }
	} else if (isFormFilename(resource)) {
		const filename = resource.formFilename
		const form = readFileSync(filename)
		return { content: form, name: filename }
	} /* if (isForm(resource)) */ else {
		// default fall-through
		return { content: resource.form, name: resource.name }
	}
}
