import { hello } from "./index";

describe("hello", () => {
  it('should return "word"', () => {
    expect(hello()).toBe("word");
  });
});
