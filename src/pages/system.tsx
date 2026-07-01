import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, Card, Col, Container, Form, Row, Spinner, Stack, Table } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { WolfyNavbar } from '../components/Navbar';
import { api, ComponentParams } from '../services/api';
import { ComponentEvent, ComponentEventTypeInfo, ComponentSnapshot } from '../models/Component';
import { LocalDanmuStatus, RemoteDanmuConfig } from '../models/Danmu';

type Drafts = Record<string, ComponentParams>;
type BusyState = Record<string, "saving" | "restarting" | "stopping" | undefined>;
type ErrorState = Record<string, string | undefined>;
type NoticeState = Record<string, string | undefined>;
type DirtyState = Record<string, boolean | undefined>;
type ParamControl = "text" | "select" | "textarea" | "password";
type DanmuBusyState = "saving" | "starting" | "stopping" | undefined;
type DanmuDraft = Record<keyof RemoteDanmuConfig, string>;

interface ComponentMeta {
    title: string;
    description: string;
    restartHint?: string;
}

interface ParamMeta {
    label: string;
    help: string;
    control?: ParamControl;
    options?: Array<{ label: string; value: string }>;
}

const componentMeta: Record<string, ComponentMeta> = {
    server: {
        title: "HTTP 服务",
        description: "本地 API 与静态资源服务。当前不支持通过 HTTP 重启自身。",
    },
    danmu: {
        title: "远程弹幕",
        description: "连接远程弹幕服务，拉取 Bilibili 弹幕并投递点歌任务。",
    },
    songs: {
        title: "歌曲库",
        description: "加载舞萌歌曲数据包、别名文件和歌曲缓存。",
    },
    tickets: {
        title: "点歌队列",
        description: "管理点歌列表、临时消息和 checkpoint。",
    },
    messages: {
        title: "消息组件",
        description: "存储最近的操作反馈和弹幕提示消息。",
    },
};

const paramMeta: Record<string, Record<string, ParamMeta>> = {
    danmu: {
        remote_base_url: {
            label: "远程服务地址",
            help: "远程弹幕 HTTP 服务地址；为空时后端使用默认远程服务。",
        },
        app_id: {
            label: "开放平台项目 ID",
            help: "必须是整数字符串。",
        },
        anchor_code: {
            label: "主播身份码",
            help: "Bilibili 直播开放平台主播身份码。",
        },
    },
    songs: {
        song_package_path: {
            label: "歌曲数据包目录",
            help: "目录内需要包含 Music.xml。cache_path 为空时才会扫描该目录。",
        },
        alias_file_path: {
            label: "Alias 文件路径",
            help: "alias JSON 文件路径，可为空。",
        },
        cache_path: {
            label: "歌曲缓存路径",
            help: "非空时 songs 启动优先读取缓存，不再扫描 song_package_path。",
        },
    },
};

const componentOrder = ["server", "songs", "messages", "tickets", "danmu"];

const componentRank = (name: string) => {
    const index = componentOrder.indexOf(name);
    return index === -1 ? componentOrder.length : index;
};

const sortComponents = (items: ComponentSnapshot[]) => {
    return [...items].sort((left, right) => {
        const rankDiff = componentRank(left.name) - componentRank(right.name);
        if (rankDiff !== 0) {
            return rankDiff;
        }
        return left.name.localeCompare(right.name);
    });
};

const statusVariant = (status: string) => {
    switch (status) {
        case "running":
            return "success";
        case "waiting":
            return "secondary";
        case "restarting":
            return "warning";
        case "error":
            return "danger";
        default:
            return "info";
    }
};

const readError = (error: unknown) => {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = (error as { response?: { data?: { msg?: string; message?: string } } }).response;
        return response?.data?.msg || response?.data?.message || "请求失败";
    }
    if (error instanceof Error) {
        return error.message;
    }
    return "请求失败";
};

const readComponentSnapshot = (error: unknown) => {
    if (typeof error !== "object" || error === null || !("response" in error)) {
        return undefined;
    }
    const response = (error as { response?: { data?: { data?: unknown } } }).response;
    const snapshot = response?.data?.data;
    if (typeof snapshot === "object" && snapshot !== null && "name" in snapshot) {
        return snapshot as ComponentSnapshot;
    }
    return undefined;
};

const readDanmuStatus = (error: unknown) => {
    if (typeof error !== "object" || error === null || !("response" in error)) {
        return undefined;
    }
    const response = (error as { response?: { data?: { data?: unknown } } }).response;
    const status = response?.data?.data;
    if (typeof status === "object" && status !== null && "status" in status && "config" in status) {
        return status as LocalDanmuStatus;
    }
    return undefined;
};

const emptyDanmuDraft: DanmuDraft = {
    remote_base_url: "",
    app_id: "",
    anchor_code: "",
};

const danmuDraftFromStatus = (status: LocalDanmuStatus): DanmuDraft => ({
    remote_base_url: status.config.remote_base_url || "",
    app_id: status.config.app_id ? String(status.config.app_id) : "",
    anchor_code: status.config.anchor_code || "",
});

const danmuConfigFromDraft = (draft: DanmuDraft): RemoteDanmuConfig => ({
    remote_base_url: draft.remote_base_url.trim(),
    app_id: Number.parseInt(draft.app_id, 10) || 0,
    anchor_code: draft.anchor_code.trim(),
});

const mergeDrafts = (components: ComponentSnapshot[], current: Drafts, dirty: DirtyState, syncAll: boolean): Drafts => {
    return components.reduce<Drafts>((acc, component) => {
        if (!syncAll && dirty[component.name] && current[component.name]) {
            acc[component.name] = current[component.name];
        } else {
            acc[component.name] = { ...component.params };
        }
        return acc;
    }, {});
};

const formatEventTime = (time: string) => {
    const date = new Date(time);
    if (Number.isNaN(date.getTime())) {
        return time || "-";
    }
    return date.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    });
};

const eventOrder = (event: ComponentEvent) => {
    const timestamp = Date.parse(event.time);
    return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getComponentMeta = (name: string): ComponentMeta => {
    return componentMeta[name] || {
        title: name,
        description: "后端返回的组件。",
    };
};

const getParamMeta = (componentName: string, key: string): ParamMeta => {
    return paramMeta[componentName]?.[key] || {
        label: key,
        help: "后端返回的参数字段。",
    };
};

export const SystemPage = () => {
    const [components, setComponents] = useState<ComponentSnapshot[]>([]);
    const [drafts, setDrafts] = useState<Drafts>({});
    const [dirtyDrafts, setDirtyDrafts] = useState<DirtyState>({});
    const [busy, setBusy] = useState<BusyState>({});
    const [errors, setErrors] = useState<ErrorState>({});
    const [notices, setNotices] = useState<NoticeState>({});
    const [danmuStatus, setDanmuStatus] = useState<LocalDanmuStatus>();
    const [danmuDraft, setDanmuDraft] = useState<DanmuDraft>(emptyDanmuDraft);
    const [danmuDirty, setDanmuDirty] = useState(false);
    const [danmuBusy, setDanmuBusy] = useState<DanmuBusyState>();
    const [danmuError, setDanmuError] = useState("");
    const [danmuNotice, setDanmuNotice] = useState("");
    const [eventTypes, setEventTypes] = useState<ComponentEventTypeInfo[]>([]);
    const [eventTypeError, setEventTypeError] = useState("");
    const [componentFilter, setComponentFilter] = useState("");
    const [eventTypeFilter, setEventTypeFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const dirtyDraftsRef = useRef<DirtyState>({});
    const danmuDirtyRef = useRef(false);
    const refreshInFlightRef = useRef(false);
    const danmuRefreshInFlightRef = useRef(false);

    const managedComponents = useMemo(() => {
        return components.filter((component) => component.name !== "danmu");
    }, [components]);

    const counts = useMemo(() => {
        return managedComponents.reduce<Record<string, number>>((acc, component) => {
            acc[component.status] = (acc[component.status] || 0) + 1;
            return acc;
        }, {});
    }, [managedComponents]);

    const componentNames = useMemo(() => {
        return components
            .map((component) => component.name)
            .sort((left, right) => {
                const rankDiff = componentRank(left) - componentRank(right);
                if (rankDiff !== 0) {
                    return rankDiff;
                }
                return left.localeCompare(right);
            });
    }, [components]);

    const eventTypeDescriptions = useMemo(() => {
        return eventTypes.reduce<Record<string, string>>((acc, item) => {
            acc[item.type] = item.description;
            return acc;
        }, {});
    }, [eventTypes]);

    const eventTypeOptions = useMemo(() => {
        const catalogTypes = eventTypes.map((item) => item.type);
        const observedTypes = components.flatMap((component) => (component.events || []).map((event) => event.type));
        return Array.from(new Set([...catalogTypes, ...observedTypes])).sort((left, right) => left.localeCompare(right));
    }, [components, eventTypes]);

    const allEvents = useMemo(() => {
        return components
            .flatMap((component) => (component.events || []).map((event) => ({
                ...event,
                component: event.component || component.name,
            })))
            .sort((left, right) => eventOrder(right) - eventOrder(left))
            .slice(0, 100);
    }, [components]);

    const filteredEvents = useMemo(() => {
        return allEvents.filter((event) => {
            const componentMatches = componentFilter === "" || event.component === componentFilter;
            const typeMatches = eventTypeFilter === "" || event.type === eventTypeFilter;
            return componentMatches && typeMatches;
        });
    }, [allEvents, componentFilter, eventTypeFilter]);

    const clearDirtyDraft = (componentName: string) => {
        setDirtyDrafts((current) => {
            const next = { ...current };
            delete next[componentName];
            dirtyDraftsRef.current = next;
            return next;
        });
    };

    const replaceComponent = (next: ComponentSnapshot, syncDraft: boolean) => {
        setComponents((current) => {
            if (current.some((component) => component.name === next.name)) {
                return sortComponents(current.map((component) => component.name === next.name ? next : component));
            }
            return sortComponents([...current, next]);
        });
        if (syncDraft) {
            setDrafts((current) => ({ ...current, [next.name]: { ...next.params } }));
        }
    };

    const loadComponents = useCallback(async (options?: { showLoading?: boolean; syncDrafts?: boolean }) => {
        if (refreshInFlightRef.current) {
            return;
        }
        refreshInFlightRef.current = true;
        const showLoading = options?.showLoading ?? false;
        const syncDrafts = options?.syncDrafts ?? false;
        if (showLoading) {
            setLoading(true);
        }
        try {
            const next = await api.components();
            const sorted = sortComponents(next);
            setComponents(sorted);
            setDrafts((current) => mergeDrafts(next, current, dirtyDraftsRef.current, syncDrafts));
            if (syncDrafts) {
                dirtyDraftsRef.current = {};
                setDirtyDrafts({});
            }
            setLoadError("");
        } catch (error) {
            setLoadError(readError(error));
        } finally {
            if (showLoading) {
                setLoading(false);
            }
            refreshInFlightRef.current = false;
        }
    }, []);

    const loadDanmuStatus = useCallback(async (options?: { syncDraft?: boolean }) => {
        if (danmuRefreshInFlightRef.current) {
            return;
        }
        danmuRefreshInFlightRef.current = true;
        const syncDraft = options?.syncDraft ?? false;
        try {
            const next = await api.getDanmuStatus();
            setDanmuStatus(next);
            if (syncDraft || !danmuDirtyRef.current) {
                setDanmuDraft(danmuDraftFromStatus(next));
                danmuDirtyRef.current = false;
                setDanmuDirty(false);
            }
            setDanmuError("");
        } catch (error) {
            setDanmuError(readError(error));
        } finally {
            danmuRefreshInFlightRef.current = false;
        }
    }, []);

    const refreshSystem = () => {
        loadComponents({ showLoading: true, syncDrafts: true });
        loadDanmuStatus({ syncDraft: true });
    };

    useEffect(() => {
        const loadEventTypes = async () => {
            setEventTypeError("");
            try {
                const next = await api.componentEventTypes();
                setEventTypes(next);
            } catch (error) {
                setEventTypeError(readError(error));
            }
        };

        loadEventTypes();
        loadComponents({ showLoading: true, syncDrafts: true });
        loadDanmuStatus({ syncDraft: true });
    }, [loadComponents, loadDanmuStatus]);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            loadComponents({ syncDrafts: false });
            loadDanmuStatus();
        }, 1000);
        return () => {
            window.clearInterval(intervalId);
        };
    }, [loadComponents, loadDanmuStatus]);

    const updateDraft = (componentName: string, key: string, value: string) => {
        setDrafts((current) => ({
            ...current,
            [componentName]: {
                ...current[componentName],
                [key]: value,
            },
        }));
        setDirtyDrafts((current) => {
            const next = { ...current, [componentName]: true };
            dirtyDraftsRef.current = next;
            return next;
        });
        setNotices((current) => ({ ...current, [componentName]: undefined }));
    };

    const saveParams = async (componentName: string) => {
        setBusy((current) => ({ ...current, [componentName]: "saving" }));
        setErrors((current) => ({ ...current, [componentName]: undefined }));
        setNotices((current) => ({ ...current, [componentName]: undefined }));
        try {
            const next = await api.updateComponentParams(componentName, drafts[componentName] || {});
            replaceComponent(next, true);
            clearDirtyDraft(componentName);
            setNotices((current) => ({ ...current, [componentName]: "参数已保存，重启组件后生效。" }));
        } catch (error) {
            setErrors((current) => ({ ...current, [componentName]: readError(error) }));
        } finally {
            setBusy((current) => ({ ...current, [componentName]: undefined }));
        }
    };

    const restart = async (componentName: string) => {
        setBusy((current) => ({ ...current, [componentName]: "restarting" }));
        setErrors((current) => ({ ...current, [componentName]: undefined }));
        setNotices((current) => ({ ...current, [componentName]: undefined }));
        try {
            const next = await api.restartComponent(componentName);
            replaceComponent(next, !dirtyDraftsRef.current[componentName]);
            setNotices((current) => ({ ...current, [componentName]: "组件已重启。" }));
        } catch (error) {
            const snapshot = readComponentSnapshot(error);
            if (snapshot?.name) {
                replaceComponent(snapshot, !dirtyDraftsRef.current[snapshot.name]);
            }
            setErrors((current) => ({ ...current, [componentName]: readError(error) }));
        } finally {
            setBusy((current) => ({ ...current, [componentName]: undefined }));
        }
    };

    const stop = async (componentName: string) => {
        if (componentName === "server") {
            return;
        }
        setBusy((current) => ({ ...current, [componentName]: "stopping" }));
        setErrors((current) => ({ ...current, [componentName]: undefined }));
        setNotices((current) => ({ ...current, [componentName]: undefined }));
        try {
            const next = await api.stopComponent(componentName);
            replaceComponent(next, !dirtyDraftsRef.current[componentName]);
            setNotices((current) => ({ ...current, [componentName]: "组件已停止。" }));
        } catch (error) {
            const snapshot = readComponentSnapshot(error);
            if (snapshot?.name) {
                replaceComponent(snapshot, !dirtyDraftsRef.current[snapshot.name]);
            }
            setErrors((current) => ({ ...current, [componentName]: readError(error) }));
        } finally {
            setBusy((current) => ({ ...current, [componentName]: undefined }));
        }
    };

    const updateDanmuDraft = (key: keyof DanmuDraft, value: string) => {
        setDanmuDraft((current) => ({
            ...current,
            [key]: value,
        }));
        danmuDirtyRef.current = true;
        setDanmuDirty(true);
        setDanmuNotice("");
    };

    const saveDanmuConfig = async () => {
        setDanmuBusy("saving");
        setDanmuError("");
        setDanmuNotice("");
        try {
            const next = await api.updateDanmuConfig(danmuConfigFromDraft(danmuDraft));
            setDanmuStatus(next);
            setDanmuDraft(danmuDraftFromStatus(next));
            danmuDirtyRef.current = false;
            setDanmuDirty(false);
            setDanmuNotice("远程弹幕配置已保存。");
        } catch (error) {
            const status = readDanmuStatus(error);
            if (status) {
                setDanmuStatus(status);
            }
            setDanmuError(readError(error));
        } finally {
            setDanmuBusy(undefined);
        }
    };

    const startDanmuBridge = async () => {
        setDanmuBusy("starting");
        setDanmuError("");
        setDanmuNotice("");
        try {
            const next = await api.startDanmu();
            setDanmuStatus(next);
            if (!danmuDirtyRef.current) {
                setDanmuDraft(danmuDraftFromStatus(next));
            }
            setDanmuNotice("远程弹幕已启动。");
            loadComponents({ syncDrafts: false });
        } catch (error) {
            const status = readDanmuStatus(error);
            if (status) {
                setDanmuStatus(status);
            }
            setDanmuError(readError(error));
        } finally {
            setDanmuBusy(undefined);
        }
    };

    const stopDanmuBridge = async () => {
        setDanmuBusy("stopping");
        setDanmuError("");
        setDanmuNotice("");
        try {
            const next = await api.stopDanmu();
            setDanmuStatus(next);
            if (!danmuDirtyRef.current) {
                setDanmuDraft(danmuDraftFromStatus(next));
            }
            setDanmuNotice("远程弹幕已停止。");
            loadComponents({ syncDrafts: false });
        } catch (error) {
            const status = readDanmuStatus(error);
            if (status) {
                setDanmuStatus(status);
            }
            setDanmuError(readError(error));
        } finally {
            setDanmuBusy(undefined);
        }
    };

    return (
        <div className="system-page">
            <WolfyNavbar />
            <Container fluid="lg" className="py-4">
                <Stack direction="horizontal" gap={3} className="mb-4 system-page__header">
                    <div>
                        <h1 className="system-page__title">系统管理</h1>
                        <div className="system-page__meta">组件状态、运行错误、参数保存、重启和事件</div>
                    </div>
                    <Button
                        variant="outline-light"
                        className="ms-auto"
                        onClick={refreshSystem}
                        disabled={loading}
                    >
                        {loading ? <Spinner animation="border" size="sm" /> : "刷新"}
                    </Button>
                </Stack>

                {loadError && <Alert variant="danger">{loadError}</Alert>}

                <Card className="system-page__danmu mb-4">
                    <Card.Header className="system-page__danmu-header">
                        <Stack direction="horizontal" gap={2} className="align-items-start flex-wrap">
                            <div>
                                <strong>远程弹幕</strong>
                                <div className="system-page__component-name">/api/danmu</div>
                            </div>
                            {danmuDirty && <Badge bg="warning" text="dark">未保存</Badge>}
                            <Badge bg={statusVariant(danmuStatus?.status || "waiting")} className="ms-auto">
                                {danmuStatus?.status || "unknown"}
                            </Badge>
                        </Stack>
                    </Card.Header>
                    <Card.Body>
                        {danmuError && <Alert variant="danger">{danmuError}</Alert>}
                        {danmuNotice && <Alert variant="info">{danmuNotice}</Alert>}
                        {danmuStatus?.error && <Alert variant="danger">{danmuStatus.error}</Alert>}

                        <Row className="g-3">
                            <Col xs={12} md={5}>
                                <Form.Label className="system-page__field-label">远程服务地址</Form.Label>
                                <Form.Control
                                    size="sm"
                                    value={danmuDraft.remote_base_url}
                                    disabled={danmuBusy !== undefined}
                                    placeholder="https://plusplus7.com:42376"
                                    onChange={(event) => updateDanmuDraft("remote_base_url", event.target.value)}
                                />
                            </Col>
                            <Col xs={12} md={3}>
                                <Form.Label className="system-page__field-label">开放平台项目 ID</Form.Label>
                                <Form.Control
                                    size="sm"
                                    value={danmuDraft.app_id}
                                    disabled={danmuBusy !== undefined}
                                    inputMode="numeric"
                                    onChange={(event) => updateDanmuDraft("app_id", event.target.value)}
                                />
                            </Col>
                            <Col xs={12} md={4}>
                                <Form.Label className="system-page__field-label">主播身份码</Form.Label>
                                <Form.Control
                                    size="sm"
                                    value={danmuDraft.anchor_code}
                                    disabled={danmuBusy !== undefined}
                                    onChange={(event) => updateDanmuDraft("anchor_code", event.target.value)}
                                />
                            </Col>
                        </Row>

                        <div className="system-page__danmu-stats">
                            <div>
                                <span>last_seq</span>
                                <strong>{danmuStatus?.last_seq ?? "-"}</strong>
                            </div>
                            <div>
                                <span>remote_base_url</span>
                                <strong>{danmuStatus?.config.remote_base_url || "-"}</strong>
                            </div>
                        </div>

                        <Stack direction="horizontal" gap={2} className="justify-content-end flex-wrap">
                            <Button
                                variant="outline-secondary"
                                onClick={saveDanmuConfig}
                                disabled={danmuBusy !== undefined}
                            >
                                {danmuBusy === "saving" ? "保存中" : "保存配置"}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={startDanmuBridge}
                                disabled={danmuBusy !== undefined}
                            >
                                {danmuBusy === "starting" ? "启动中" : "启动弹幕"}
                            </Button>
                            <Button
                                variant="outline-danger"
                                onClick={stopDanmuBridge}
                                disabled={danmuBusy !== undefined}
                            >
                                {danmuBusy === "stopping" ? "停止中" : "停止弹幕"}
                            </Button>
                        </Stack>
                    </Card.Body>
                </Card>

                <Row className="g-3 mb-4">
                    {["running", "waiting", "restarting", "error"].map((status) => (
                        <Col xs={6} md={3} key={status}>
                            <Card className="system-page__metric">
                                <Card.Body>
                                    <div className="system-page__metric-value">{counts[status] || 0}</div>
                                    <div className="system-page__metric-label">{status}</div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>

                {loading && components.length === 0 ? (
                    <div className="system-page__loading">
                        <Spinner animation="border" />
                    </div>
                ) : (
                    <Row className="g-3">
                        {managedComponents.map((component) => {
                            const componentBusy = busy[component.name];
                            const params = drafts[component.name] || {};
                            const paramKeys = Object.keys(params);
                            const meta = getComponentMeta(component.name);
                            return (
                                <Col xs={12} lg={6} key={component.name}>
                                    <Card className="system-page__component">
                                        <Card.Header className="system-page__component-header">
                                            <Stack direction="horizontal" gap={2} className="align-items-start">
                                                <div>
                                                    <strong>{meta.title}</strong>
                                                    <div className="system-page__component-name">{component.name}</div>
                                                </div>
                                                {dirtyDrafts[component.name] && <Badge bg="warning" text="dark">未保存</Badge>}
                                                <Badge bg={statusVariant(component.status)} className="ms-auto">{component.status}</Badge>
                                            </Stack>
                                        </Card.Header>
                                        <Card.Body>
                                            <p className="system-page__component-description">{meta.description}</p>
                                            {meta.restartHint && <Alert variant="warning">{meta.restartHint}</Alert>}
                                            {component.error && <Alert variant="danger">{component.error}</Alert>}
                                            {errors[component.name] && <Alert variant="danger">{errors[component.name]}</Alert>}
                                            {notices[component.name] && <Alert variant="info">{notices[component.name]}</Alert>}
                                            {paramKeys.length > 0 ? (
                                                <Table responsive size="sm" className="system-page__params">
                                                    <tbody>
                                                        {paramKeys.map((key) => {
                                                            const field = getParamMeta(component.name, key);
                                                            const value = params[key] ?? "";
                                                            return (
                                                                <tr key={key}>
                                                                    <td className="system-page__param-key">
                                                                        <span>{field.label}</span>
                                                                        <code>{key}</code>
                                                                    </td>
                                                                    <td>
                                                                        {field.control === "select" ? (
                                                                            <Form.Select
                                                                                size="sm"
                                                                                value={value}
                                                                                disabled={componentBusy !== undefined}
                                                                                onChange={(event) => updateDraft(component.name, key, event.target.value)}
                                                                            >
                                                                                {(field.options || []).map((option) => (
                                                                                    <option value={option.value} key={option.value}>{option.label}</option>
                                                                                ))}
                                                                            </Form.Select>
                                                                        ) : field.control === "textarea" ? (
                                                                            <Form.Control
                                                                                as="textarea"
                                                                                rows={3}
                                                                                size="sm"
                                                                                value={value}
                                                                                disabled={componentBusy !== undefined}
                                                                                onChange={(event) => updateDraft(component.name, key, event.target.value)}
                                                                            />
                                                                        ) : (
                                                                            <Form.Control
                                                                                size="sm"
                                                                                type={field.control === "password" ? "password" : "text"}
                                                                                value={value}
                                                                                disabled={componentBusy !== undefined}
                                                                                onChange={(event) => updateDraft(component.name, key, event.target.value)}
                                                                            />
                                                                        )}
                                                                        <Form.Text className="system-page__param-help">{field.help}</Form.Text>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </Table>
                                            ) : (
                                                <div className="system-page__empty">当前组件没有可配置参数</div>
                                            )}
                                            <Stack direction="horizontal" gap={2} className="justify-content-end">
                                                <Button
                                                    variant="outline-secondary"
                                                    onClick={() => saveParams(component.name)}
                                                    disabled={componentBusy !== undefined}
                                                >
                                                    {componentBusy === "saving" ? "保存中" : "保存参数"}
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => restart(component.name)}
                                                    disabled={componentBusy !== undefined}
                                                >
                                                    {componentBusy === "restarting" ? "重启中" : "重启组件"}
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    onClick={() => stop(component.name)}
                                                    disabled={componentBusy !== undefined || component.name === "server"}
                                                >
                                                    {componentBusy === "stopping" ? "停止中" : "停止组件"}
                                                </Button>
                                            </Stack>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
                {components.length > 0 && (
                    <Card className="system-page__events mt-4">
                        <Card.Header className="system-page__events-header">
                            <Stack direction="horizontal" gap={2} className="align-items-start flex-wrap">
                                <div>
                                    <strong>组件事件</strong>
                                    <div className="system-page__component-name">最近 {allEvents.length} 条</div>
                                </div>
                                <Badge bg="info" className="ms-auto">{filteredEvents.length}</Badge>
                            </Stack>
                        </Card.Header>
                        <Card.Body>
                            {eventTypeError && <Alert variant="warning">事件类型说明加载失败：{eventTypeError}</Alert>}
                            <Row className="g-2 mb-3">
                                <Col xs={12} md={4}>
                                    <Form.Select
                                        size="sm"
                                        value={componentFilter}
                                        onChange={(event) => setComponentFilter(event.target.value)}
                                    >
                                        <option value="">全部组件</option>
                                        {componentNames.map((name) => (
                                            <option value={name} key={name}>{name}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                                <Col xs={12} md={8}>
                                    <Form.Select
                                        size="sm"
                                        value={eventTypeFilter}
                                        onChange={(event) => setEventTypeFilter(event.target.value)}
                                    >
                                        <option value="">全部事件类型</option>
                                        {eventTypeOptions.map((type) => (
                                            <option value={type} key={type}>{type}</option>
                                        ))}
                                    </Form.Select>
                                </Col>
                            </Row>

                            {filteredEvents.length > 0 ? (
                                <Table responsive size="sm" className="system-page__events-table">
                                    <thead>
                                        <tr>
                                            <th>时间</th>
                                            <th>组件</th>
                                            <th>类型</th>
                                            <th>说明</th>
                                            <th>消息</th>
                                            <th>位置</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEvents.map((event, index) => (
                                            <tr key={`${event.time}-${event.component}-${event.type}-${index}`}>
                                                <td className="system-page__event-time">{formatEventTime(event.time)}</td>
                                                <td><Badge bg="secondary">{event.component}</Badge></td>
                                                <td className="system-page__event-type"><code>{event.type}</code></td>
                                                <td className="system-page__event-description">{eventTypeDescriptions[event.type] || "-"}</td>
                                                <td className="system-page__event-message">{event.message || "-"}</td>
                                                <td className="system-page__event-location"><code>{event.code_location || "-"}</code></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="system-page__empty">暂无组件事件</div>
                            )}
                        </Card.Body>
                    </Card>
                )}
            </Container>
        </div>
    );
};
