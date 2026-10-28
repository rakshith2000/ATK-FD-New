export interface LicensePayload {
    iss: string;
    aud: string;
    sub: string;
    licenseId: string;
    product: string;
    edition: string;
    ver: number;
    modules: Record<string, boolean>;
    features: Record<string, boolean>;
}
