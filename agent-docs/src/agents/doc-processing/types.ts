export interface FilePayload {
  path: string;
  content: string; // base64-encoded
}

export interface SyncPayload {
  commit?: string;
  repo?: string;
  changed?: FilePayload[];
  removed?: string[];
}

export interface SyncStats {
  processed: number;
  deleted: number;
  errors: number;
  errorFiles: string[];
} 