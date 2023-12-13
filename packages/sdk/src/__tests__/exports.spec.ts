import { C8 } from '../index'

test("exports as expected", () => {
    expect(typeof C8.ZBClient).toBe("function")
    expect(typeof C8.OperateApiClient).toBe("function")
    expect(typeof C8.OptimizeApiClient).toBe("function")
})