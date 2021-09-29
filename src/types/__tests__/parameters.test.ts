import { GetMessagesParameters } from "../parameters";


const decodingCases: ReadonlyArray<[
  input: unknown,
  expectedResult: boolean
]> = [
  // all fields are optional
  [{}, true],
  // pageSize: must be a string representing a natural integer
  [{ pageSize: "1" }, true],
  [{ pageSize: NaN }, false],
  [{ pageSize: -1 }, false],
  [{ pageSize: 1.2 }, false],
  [{ pageSize: 1 }, false],
  // enrichResultData: must be a string representing a boolean value
  [{ enrichResultData: true }, false],
  [{ enrichResultData: "true" }, true],
  [{ enrichResultData: "Falze" }, false],
  [{
    pageSize: "1",
    enrichResultData: "false",
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
