import got from 'got'

import { ReportDataExporter, ReportDataPage } from './APIObjects'

type Headers = { [key: string]: string }

export class ReportResults implements ReportDataExporter {
	private searchRequestId?: string
	private getHeaders: () => Promise<Headers>
	private reportId: string
	private limit: number
	private paginationTimeout: number
	private rest: typeof got
	constructor({
		getHeaders,
		rest,
		limit,
		reportId,
		paginationTimeout,
	}: {
		getHeaders: () => Promise<Headers>
		rest: typeof got
		reportId: string
		limit: number
		paginationTimeout: number
	}) {
		this.getHeaders = getHeaders
		this.rest = rest
		this.reportId = reportId
		this.limit = limit
		this.paginationTimeout = paginationTimeout
	}

	next() {
		return this.getResultsPage()
	}

	private async getResultsPage(): Promise<ReportDataPage> {
		const headers = await this.getHeaders()
		const sreqId = this.searchRequestId
			? `&searchRequestId=${this.searchRequestId}`
			: ''
		const result = await this.rest(
			`export/report/${this.reportId}/result/json?paginationTimeout=${this.paginationTimeout}&limit=${this.limit}${sreqId}`,
			{
				headers,
			}
		).json()
		this.searchRequestId = (
			result as { searchRequestId: string }
		).searchRequestId
		return result as ReportDataPage
	}
}
