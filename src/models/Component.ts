export type ComponentStatus = "waiting" | "running" | "error" | "restarting" | string;

export interface ComponentEvent {
    time: string;
    component: string;
    type: string;
    code_location: string;
    message: string;
}

export interface ComponentEventTypeInfo {
    type: string;
    description: string;
}

export interface ComponentSnapshot {
    name: string;
    status: ComponentStatus;
    error: string;
    params: Record<string, string>;
    events: ComponentEvent[];
}
