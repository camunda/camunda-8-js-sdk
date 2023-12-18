export class Utils {
	/**
	 * Throw an Error if the variable passed is not a number
	 */
	public static validateNumber(variable: string | number, field: string): void {
		const value = Number(variable)
		if (!Number.isInteger(value)) {
			throw new Error(`
		  ${field} is malformed, value : ${variable}
		  `)
		}
	}

	public static deepClone(obj, hash = new WeakMap()) {
		if (obj === null || typeof obj !== 'object') {
			return obj
		}

		if (hash.has(obj)) {
			return hash.get(obj)
		}

		let result
		if (obj instanceof Date) {
			result = new Date(obj)
		} else if (obj instanceof RegExp) {
			result = new RegExp(obj.source, obj.flags)
		} else if (obj instanceof Array) {
			result = []
			hash.set(obj, result)
			obj.forEach((item, index) => {
				result[index] = Utils.deepClone(item, hash)
			})
		} else {
			result = {}
			hash.set(obj, result)
			Object.keys(obj).forEach((key) => {
				result[key] = Utils.deepClone(obj[key], hash)
			})
		}
		return result
	}
}
