/* eslint-disable prettier/prettier */
export interface GoogleServiceAccount {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
    universe_domain: string;
}

export interface FileDataResponse {
    fileId: string;
    name: string;
}

export interface FileFoundResponse {
    exist: boolean;
    fileData?: FileDataResponse;
}