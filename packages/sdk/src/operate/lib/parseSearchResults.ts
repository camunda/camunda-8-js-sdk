import { losslessParse, losslessStringify } from '@camunda8/lossless-json'

import { SearchResults } from './OperateDto'

export function parseSearchResults<T>(
	json: string,
	dto: { new (): T }
): SearchResults<T> {
	const parsedResult = losslessParse(json) as SearchResults<T>

	// Assuming `parsedResult` matches the structure of `SearchResults<T>`
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const items = parsedResult.items.map((item: any) =>
		losslessParse(losslessStringify(item) as string, dto)
	)

	// Apply additional parsing or annotations if necessary
	// For each item in the array, you could potentially apply the same or similar logic
	// as in `losslessParse` if your items have properties that need special handling.

	const total = parsedResult.total.toString() // Or convert based on your needs

	// Construct the final object, assuming `SearchResults` is a simple interface without methods
	const result: SearchResults<T> = {
		items: items as T[],
		sortValues: parsedResult.sortValues, // Handle according to your needs
		total,
	}

	return result
}
