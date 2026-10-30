export interface AssertionResult {
	status: string
	fullName?: string
	title?: string
}
export interface FileResult {
	name: string
	assertionResults?: AssertionResult[]
}
export interface VitestJsonReport {
	testResults?: FileResult[]
}
export function checkReport(
	report: VitestJsonReport,
	requiredSpecs: string[],
	options?: { fileExists?: (spec: string) => boolean }
): string[]
