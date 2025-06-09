interface ServiceInfo {
    info: string
    err: string
}
export interface SysInfo {
    anchor_code: string
    app_id: string
    system_error: string
    game: string
    service: {[service:string]: ServiceInfo}
}