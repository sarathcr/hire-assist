export interface FileRequest {
  attachmentType: number;
  file: File;
  files?: File[];
}

export interface FileDto {
  id?: string;
  name?: string;
  path?: string;
  url?: string;
  blobId?: string;
  attachmentType?: number;
}
