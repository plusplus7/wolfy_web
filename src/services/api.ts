import axios from "axios";

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

    public async sysInfo() {
        const resp = await axios.get(this.url + "/sysinfo")
        return resp.data.data;
    }
  
    public async event(operator: string, command:string, content:string) {
        const resp = await axios.get(`${this.url}/event/${operator}/${command}/${content}`)
        return resp.data.data.tickets
    }
}

//export const api = new LocalAPI("http://localhost:53427/api");
export const api = new LocalAPI("/api");