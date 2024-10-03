/* eslint-disable prettier/prettier */
import { Observable } from "rxjs";

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
    parents: string[];
    createdTime: Date;
}

export interface ElaboratedFile extends File {
    elaborated: boolean;
}

export interface ExistFIle {
    exist: boolean;
    data: File;
}

export interface SearchFilesResponse {
    files: File[];
    quantity: number;
}

export interface Folder extends Omit<File, 'parents' | 'createdTime'> {}

export interface SearchFoldersResponse {
    folders: Folder[];
    quantity: number;
}

export interface ProgressUploadFile {
    progress$: Observable<number>; 
    finalId: Promise<string>
}

export interface FileFilters {
    name?: string;
    status?: 'only-elaborated' | 'no-elaborated';
}