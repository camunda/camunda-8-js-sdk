import {losslessParse, losslessStringify} from '@camunda8/lossless-json'
import {type SearchResults} from '../../dto/operate-dto.js'

export function parseSearchResults<T>(
	json: string,
	dto: new () => T,
): SearchResults<T> {
	const parsedResult = losslessParse(json)

	// Assuming `parsedResult` matches the structure of `SearchResults<T>`

	const items = parsedResult.items.map((item: any) =>
		losslessParse(losslessStringify(item), dto),
	)

	// Apply additional parsing or annotations if necessary
	// For each item in the array, you could potentially apply the same or similar logic
	// as in `losslessParse` if your items have properties that need special handling.

	const total = parsedResult.total.toString() // Or convert based on your needs

	// Construct the final object, assuming `SearchResults` is a simple interface without methods
	const result: SearchResults<T> = {
		items,
		sortValues: parsedResult.sortValues, // Handle according to your needs
		total,
	}

	return result
}
