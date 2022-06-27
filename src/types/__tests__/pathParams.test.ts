import {pathParamsFromUrl} from "../pathParams";
import * as E from "fp-ts/Either";

const anId = "12345";
const anUrl = `/tests/${anId}`;

describe("pathParamsFromUrl", () => {
    it("decode a vaild simple test", () =>{
        const test = pathParamsFromUrl(RegExp("^/tests/([^/]+)$"), ([id]) => `/tests/${id}`);
        const results = test.decode(anUrl);
        expect(E.isRight(results)).toBeTruthy();
        if(E.isRight(results)) {
            expect(results.right).toEqual(expect.arrayContaining([anUrl, anId]));
        }
    })

    it("decode a not vaild simple test", () =>{
        const test = pathParamsFromUrl(RegExp("^/test/([^/]+)$"), ([id]) => `/tests/${id}`);
        const results = test.decode(anUrl);
        expect(E.isLeft(results)).toBeTruthy();
        if(E.isLeft(results)) {
            expect(results.left).toMatchSnapshot();
        }
    })

    it("encode simple test", () =>{
        const test = pathParamsFromUrl(RegExp("^/tests/([^/]+)$"), ([id]) => `/tests/${id}`);
        const result = test.encode([anId]);
        expect(result).toEqual(anUrl);
    })
});