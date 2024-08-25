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

export interface File {
    id: string;
    name: string;
}

export interface FileFoundResponse {
    exist: boolean;
    fileData?: File;
}

export interface SearchFilesResponse {
    files: File[];
    quantity: number;
}

export interface Folder extends File {}

export interface SearchFoldersResponse {
    folders: Folder[];
    quantity: number;
}