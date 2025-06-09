import { Button, Form, InputGroup, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import { api } from '../services/api';
import { SysInfo } from '../models/SysInfo';


export interface StartUpProps {
    sysInfo: SysInfo;
    content: string;
    onSetSysInfo: (data: any) => void;
}
export const StartUp = (props: StartUpProps) => {
    const [anchorCode, setAnchorCode] = useState(props.sysInfo.anchor_code);
    const handleSubmit = async () => {
        const resp = await api.event("主播", "set_anchor_code", anchorCode);
        props.onSetSysInfo(resp);
    }
    return (<Modal show={true} onHide={handleSubmit}>
        <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <h5>{props.content}</h5>
            身份码
            <InputGroup className="mb-3">
                <Form.Control
                    onChange={(e) => setAnchorCode(e.target.value)}
                />
            </InputGroup>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="primary" onClick={handleSubmit}>
                提交
            </Button>
        </Modal.Footer>
    </Modal>)

}
