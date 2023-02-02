import * as E from "fp-ts/Either";

import { LollipopMethod } from "../../generated/lollipop/LollipopMethod";
import { LollipopOriginalURL } from "../../generated/lollipop/LollipopOriginalURL";
import { LollipopContentType } from "../../generated/lollipop/LollipopContentType";
import { LollipopContentDigest } from "../../generated/lollipop/LollipopContentDigest";
import { LollipopSignatureInput } from "../../generated/lollipop/LollipopSignatureInput";
import { LollipopSignature } from "../../generated/lollipop/LollipopSignature";

describe("LollipopMethodHeader", () => {
  it("should decode a valid method", async () => {
    const value = "GET";

    const res = LollipopMethod.decode(value);
    expect(res).toMatchObject(E.right(value));
  });

  it("should fail with an invalid method", async () => {
    const value = "GETT";

    const res = LollipopMethod.decode(value);
    expect(res).toMatchObject(E.left(expect.any(Array)));
  });
});

describe("LollipopOriginalURL", () => {
  it("should decode a valid url", async () => {
    const value = "http://example.com/foo?param=value&pet=dog";

    const res = LollipopOriginalURL.decode(value);

    expect(res).toMatchObject(E.right(value));
  });

  it("should fail with an invalid URL", async () => {
    const value = "http://example.com/foo/../foo2?param=value&pet=dog";

    const res = LollipopOriginalURL.decode(value);
    expect(res).toMatchObject(E.left(expect.any(Array)));
  });
});

describe("LollipopContentType", () => {
  it("should decode a valid content type", async () => {
    const value = "application/json";

    const res = LollipopContentType.decode(value);

    expect(res).toMatchObject(E.right(value));
  });

  it("should fail with an invalid content type", async () => {
    const value = "application/other";

    const res = LollipopContentType.decode(value);
    expect(res).toMatchObject(E.left(expect.any(Array)));
  });
});

describe("LollipopContentDigest", () => {
  it("should decode a valid digest", async () => {
    const value =
      "sha-512=:WZDPaVn/7XgHaAy8pmojAkGWoRx2UFChF41A2svX+T\
  aPm+AbwAgBWnrIiYllu7BNNyealdVLvRwEmTHWXvJwew==:";

    const res = LollipopContentDigest.decode(value);

    expect(res).toMatchObject(E.right(value));
  });

  it("should fail with an invalid digest", async () => {
    const value =
      ":WZDPaVn/7XgHaAy8pmojAkGWoRx2UFChF41A2svX+T\
  aPm+AbwAgBWnrIiYllu7BNNyealdVLvRwEmTHWXvJwew==:";

    const res = LollipopContentDigest.decode(value);
    expect(res).toMatchObject(E.left(expect.any(Array)));
  });
});

describe("LollipopSignatureInput", () => {
  it("should decode a valid signature input", async () => {
    const value = `sig1=("x-io-sign-qtspclauses");created=1675258547;nonce="aNonce";alg="ecdsa-p384-sha384";keyid="aKeyId"`;

    const res = LollipopSignatureInput.decode(value);
    expect(res).toMatchObject(E.right(value));
  });

  it("should decode a valid multi-signature input", async () => {
    const value = `sig1=("x-io-sign-qtspclauses");created=1675258547;nonce="aNonce";alg="ecdsa-p384-sha384";keyid="aKeyId, sig2=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url");created=1675258547;nonce="aNonce";alg="ecdsa-p384-sha384";keyid="aKeyId"`;

    const res = LollipopSignatureInput.decode(value);
    expect(res).toMatchObject(E.right(value));
  });

  it("should fail with an invalid signature input", async () => {
    const value = `("x-io-sign-qtspclauses");created=1675258547;nonce="aNonce";alg="ecdsa-p384-sha384";keyid="aKeyId", sig2=("x-pagopa-lollipop-original-method" "x-pagopa-lollipop-original-url");created=1675258547;nonce="aNonce";alg="ecdsa-p384-sha384";keyid="aKeyId`;

    const res = LollipopSignatureInput.decode(value);
    expect(res).toMatchObject(E.left(expect.any(Array)));
  });
});

describe("LollipopSignature", () => {
  it("should decode a valid signature", async () => {
    const value = `sig1=:wdsNx2jtTeDayCaf6wn1IKxdxuvUV2EZnbPhAVS9v1ZWAfyN0gbVRC1hi+0T7ysuHF6dHdxHB81ELTbe7tz3lzQbRMYn7FW+kjeT8CL+gb1hUHeWESvxlPgbd7xZxp0i:`;

    const res = LollipopSignature.decode(value);

    expect(res).toMatchObject(E.right(value));
  });

  it("should decode a valid multi-signature", async () => {
    const value = `sig1=:wdsNx2jtTeDayCaf6wn1IKxdxuvUV2EZnbPhAVS9v1ZWAfyN0gbVRC1hi+0T7ysuHF6dHdxHB81ELTbe7tz3lzQbRMYn7FW+kjeT8CL+gb1hUHeWESvxlPgbd7xZxp0i:, sig2=:Y3p2rx43PYOwsvR/7xRK3ysbOwxVJQdhE3OSVhGDtrMWqsdfo6iDGL8HhyHVhdcE/GiLUsLKhYClJuNtWN46nHnKAz2OarVuhplQCxG/dxgA/b8jDddFjZuiJKi2n5d+:`;

    const res = LollipopSignature.decode(value);

    expect(res).toMatchObject(E.right(value));
  });

  it("should fail with an invalid signature", async () => {
    const value = `:wdsNx2jtTeDayCaf6wn1IKxdxuvUV2EZnbPhAVS9v1ZWAfyN0gbVRC1hi+0T7ysuHF6dHdxHB81ELTbe7tz3lzQbRMYn7FW+kjeT8CL+gb1hUHeWESvxlPgbd7xZxp0i:, sig2=:Y3p2rx43PYOwsvR/7xRK3ysbOwxVJQdhE3OSVhGDtrMWqsdfo6iDGL8HhyHVhdcE/GiLUsLKhYClJuNtWN46nHnKAz2OarVuhplQCxG/dxgA/b8jDddFjZuiJKi2n5d+:`;

    const res = LollipopSignature.decode(value);
    expect(res).toMatchObject(E.left(expect.any(Array)));
  });
});
