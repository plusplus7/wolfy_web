import { Col, Container, Row } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TicketGroup } from '../components/TicketGroup';
import { Messages} from '../components/Messages';


export const Stage = () => {
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const refresh = async () => {
    try {
      const items = await api.tickets()
      setTickets(items);
    } catch(error) {
      console.log(error)
    }
    try {
      const items = await api.messages()
      setMessages(items);
    } catch(error) {
      console.log(error)
    }
  }

  useEffect(() => {
    const intervalCall = setInterval(() => {
      refresh();
    }, 1000);
    return () => {
      clearInterval(intervalCall);
    };
  }, []);

  return (
    <Container fluid={true}>
      <Row>
        <Col xs={12}>
        <TicketGroup tickets={tickets}></TicketGroup>
        <Messages messages={messages}></Messages>
        </Col>
      </Row>
    </Container>
  );
};
