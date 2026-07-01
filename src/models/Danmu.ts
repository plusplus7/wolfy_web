export interface RemoteDanmuConfig {
    remote_base_url: string;
    app_id: number;
    anchor_code: string;
}

export interface LocalDanmuStatus {
    status: string;
    config: RemoteDanmuConfig;
    last_seq: number;
    error?: string;
}
