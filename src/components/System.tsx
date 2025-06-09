import { Col, Form, Modal, Row } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { SysInfo } from '../models/SysInfo';
import QRCode from "react-qr-code";


interface Props {
  sysInfo: SysInfo;
  show: boolean;
  close: () => void;
}

export const System = (props: Props) => {

  return (
    <Modal show={props.show} onHide={props.close}>

      <Modal.Body>
        <Form>
          <Form.Group as={Row} className="mb-3" controlId="formPlaintextEmail">
            <Form.Label column sm="2">
              主播码
            </Form.Label>
            <Col sm="10">
              <Form.Control disabled={true} type="text" placeholder="输入主播码" value={props.sysInfo.anchor_code} />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" controlId="formPlaintextPassword">
            <Form.Label column sm="2">
              链接
            </Form.Label>
            <Col sm="10">
              <Form.Control minLength={100} disabled={true} placeholder="" value={props.sysInfo.service?.["http"]?.info} />
            </Col>
            <QRCode value={props.sysInfo.service?.["http"]?.info} />
          </Form.Group>
        </Form>
      </Modal.Body>
    </Modal>
  );
};
