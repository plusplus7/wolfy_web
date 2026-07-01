import axios from "axios";
import { ComponentEventTypeInfo, ComponentSnapshot } from "../models/Component";
import { LocalDanmuStatus, RemoteDanmuConfig } from "../models/Danmu";

export type ComponentParams = Record<string, string>;

export class LocalAPI {
    url: string;
    constructor(url: string) {
        this.url = url;
    }

    public async tickets() {
        const resp = await axios.get(this.url + "/tickets")
        return resp.data.data.tickets
    }

    public async messages() {
        const resp = await axios.get(this.url + "/messages")
        return resp.data.data.messages
    }

    public async sysInfo(): Promise<ComponentSnapshot[]> {
        const resp = await axios.get(this.url + "/sysinfo")
        return resp.data.data;
    }

    public async components(): Promise<ComponentSnapshot[]> {
        const resp = await axios.get(this.url + "/components")
        return resp.data.data;
    }

    public async componentEventTypes(): Promise<ComponentEventTypeInfo[]> {
        const resp = await axios.get(this.url + "/component-event-types")
        return resp.data.data.types;
    }

    public async updateComponentParams(name: string, params: ComponentParams): Promise<ComponentSnapshot> {
        const resp = await axios.patch(`${this.url}/components/${encodeURIComponent(name)}/params`, { params })
        return resp.data.data;
    }

    public async restartComponent(name: string): Promise<ComponentSnapshot> {
        const resp = await axios.post(`${this.url}/components/${encodeURIComponent(name)}/restart`)
        return resp.data.data;
    }

    public async stopComponent(name: string): Promise<ComponentSnapshot> {
        const resp = await axios.post(`${this.url}/components/${encodeURIComponent(name)}/stop`)
        return resp.data.data;
    }

    public async getDanmuStatus(): Promise<LocalDanmuStatus> {
        const resp = await axios.get(`${this.url}/danmu`)
        return resp.data.data;
    }

    public async updateDanmuConfig(config: RemoteDanmuConfig): Promise<LocalDanmuStatus> {
        const resp = await axios.patch(`${this.url}/danmu`, { config })
        return resp.data.data;
    }

    public async startDanmu(): Promise<LocalDanmuStatus> {
        const resp = await axios.post(`${this.url}/danmu/start`)
        return resp.data.data;
    }

    public async stopDanmu(): Promise<LocalDanmuStatus> {
        const resp = await axios.post(`${this.url}/danmu/stop`)
        return resp.data.data;
    }
  
    public async event(operator: string, command:string, content:string) {
        const path = [
            operator,
            command,
            content,
        ].map(encodeURIComponent).join("/")
        const resp = await axios.get(`${this.url}/event/${path}`)
        return resp.data.data
    }
}

export const api = new LocalAPI("/api");
//export const api = new LocalAPI("/api");
