/**
 * This are keys for the various APIs. In some scenarios, a token request to an authentication endpoint requires
 * a specific audience that depends on the API that is being called. For example, the `ZEEBE` audience is used for
 * the Zeebe API, while the `OPTIMIZE` audience is used for the Optimize API.
 *
 * Any implementation of IOAuthProvider will be called with one of these keys for an authorization header,
 * depending on which API client is requesting the header.
 *
 * See the `OAuthProvider` implementation for an example of how this is used.
 *
 * In cases where the audience is not required (such as cookie or basic authentication), it can be ignored.
 */
export type TokenGrantAudienceType =
	| 'OPERATE'
	| 'ZEEBE'
	| 'OPTIMIZE'
	| 'TASKLIST'
	| 'CONSOLE'
	| 'MODELER'

/**
 * These are the default auth headers that are used by the {@link IOAuthProvider} implementations in the SDK.
 * You can use these headers to set the authentication headers for your API requests.
 * You can also extend this type to add any other headers that are required by your API endpoints.
 */
export type AuthHeader = {
	[K in 'authorization' | 'cookie']?: string
}
export type HeadersPromise = Promise<AuthHeader>

/**
 * An object that provides this interface is responsible for providing
 * authentication headers to the SDK. The SDK will use the provided
 * header(s) on requests to the Camunda 8 API endpoints.
 *
 * This interface is used by the SDK to support different authentication
 * mechanisms, such as OAuth2, Basic Auth, and others. The SDK will
 * call the `getToken` method to retrieve the authentication headers
 * for a specific audience. The audience is a string that identifies
 * the API endpoint that the SDK is trying to access.
 *
 * You can implement this interface to create a custom authentication
 * provider that meets your specific needs. You could also use this
 * interface to add any other headers that are required by your API endpoints.
 */
export interface IOAuthProvider<
	T extends { [key: string]: string } = AuthHeader,
> {
	/**
	 * Called by the SDK to get the authentication headers for a specific audience.
	 * The audience is a string that identifies the API endpoint that the SDK
	 * is trying to access. The SDK will use the provided headers on requests
	 * to the Camunda 8 API endpoint.
	 * @param audience - The audience for which to get the authentication headers.
	 * @returns A promise that resolves to an object containing the authentication headers.
	 */
	getToken(audience: TokenGrantAudienceType): Promise<T>

	/**
	 * This is an optional method that can be implemented by the provider to
	 * set the token for a specific audience. This method is useful for scenarios
	 * where the token needs to be set manually, such as when using a static
	 * bearer token or when managing the token lifecycle yourself.
	 *
	 * The SDK will not call this method automatically. It is up to the
	 * implementation or the consumer to call this method when the token needs to be set.
	 * @param audience
	 * @param token
	 */
	setToken?(audience: TokenGrantAudienceType, token: string): Promise<void>
}
