declare module "x509" {
    function parseCert(path: string): CertProperties
}

declare interface CertProperties {
    notBefore: Date;
    notAfter: Date;
}

