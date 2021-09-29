import { GetMessagesParameters } from "../parameters";


const decodingCases: ReadonlyArray<[
  input: unknown,
  expectedResult: boolean
]> = [
  // all fields are optional
  [{}, true],
  // must be a number
  [{ pageSize: "1" }, false],
  [{ pageSize: 1 }, true],
  [{ pageSize: NaN }, false],
  // must be a natural integer
  [{ pageSize: -1 }, false],
  [{ enrichResultData: true }, true],
  // must be a boolean
  [{ enrichResultData: "true" }, false],
  [{
    pageSize: 1,
    enrichResultData: true,
    maximumId: "id1",
    minimumId: "id0"
  }, true]

];

describe("GetMessagesParameters decoder", () => {
  it("should decode the input with the expected result", async () => {
    decodingCases.forEach(item => {
      const [input, output] = item;
      expect(GetMessagesParameters.decode(input).isRight()).toEqual(output
      );
    });
  });
});
