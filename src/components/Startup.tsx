import { Button, Form, InputGroup, Modal } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import { api } from '../services/api';
import {Metadata} from '../models/Metadata';


export interface StartUpProps {
    metadata: Metadata;
    onSetMetadata: (data: any) => void;
}
export const StartUp = (props:StartUpProps) => {
    const [anchorCode, setAnchorCode] = useState(props.metadata.anchor_code);
    const handleSubmit = async () => {
        const resp = await api.setMetadata({
            ...props.metadata,
            anchor_code: anchorCode,
        }as Metadata);
        props.onSetMetadata(resp);

    }
    return ( <Modal show={true} onHide={handleSubmit}>
                        <Modal.Header closeButton>
                            <Modal.Title>Modal heading</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            主播码
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
