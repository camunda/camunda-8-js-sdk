import { OAuthProviderImpl } from "./OAuthProviderImpl";

export const instances: OAuthProviderImpl[] = []

export function _close() {
    instances.forEach(o => o.close())
}