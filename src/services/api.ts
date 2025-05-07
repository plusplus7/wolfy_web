import axios from "axios";
import { Metadata } from "../models/Metadata";
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

    public async metadata() {
        const resp = await axios.get(this.url + "/metadata")
        return resp.data.data;
    }
    public async setMetadata(metadata: Metadata) {
        const resp = await axios.post(this.url + "/metadata", metadata)
        console.log(metadata);
        return resp.data.data;
    }

    public async event(operator: string, command:string, content:string) {
        const resp = await axios.get(`${this.url}/event/${operator}/${command}/${content}`)
        return resp.data.data.tickets
    }
}
export const api = new LocalAPI("http://localhost:41377");