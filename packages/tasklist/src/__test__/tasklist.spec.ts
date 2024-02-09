import { TasklistApiClient } from '../index'

it('throws during construction with no env variables set', () => {
    const prev = process.env.ZEEBE_ADDRESS
    delete process.env.ZEEBE_ADDRESS
    try {
        new TasklistApiClient()
    } catch (e: unknown) {
        expect((e as Error).message).toBe('Missing environment variable: ZEEBE_ADDRESS')
    }
    process.env.ZEEBE_ADDRESS = prev
})
