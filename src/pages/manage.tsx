import { Col, Container, Dropdown, DropdownButton, Form, InputGroup, ListGroup, Nav, Navbar, NavDropdown, Row, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TicketGroup } from '../components/TicketGroup';
import { Messages} from '../components/Messages';


export const Backstage = () => {
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [action, setAction] = useState("点歌");
  const [command, setCommand] = useState("");
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
        <div>
            <WolfyNavbar></WolfyNavbar>
            <br />
            <Container>
                <Tab.Container id="list-group-tabs-example" defaultActiveKey="#link1">
                    <Row>
                        <Col sm={4}>
                            <InputGroup className="mb-3">
                                <DropdownButton
                                    variant="outline-secondary"
                                    title={action}
                                    id="input-group-dropdown-1"
                                >
                                    <Dropdown.Item onClick={()=>setAction("点歌")}>点歌</Dropdown.Item>
                                    <Dropdown.Item onClick={()=>setAction("换歌")}>换歌</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item href="#">Separated link</Dropdown.Item>
                                </DropdownButton>
                                <Form.Control 
                                    onChange={(e) => setCommand(e.target.value)} 
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter' && command !== "") {
                                            await api.event('主播', 'pick', command)
                                        }
                                    }
                                    }
                                />
                            </InputGroup>
                        </Col>
                        <Col sm={8}>
                            <TicketGroup tickets={tickets}></TicketGroup>
                            <Messages messages={messages}></Messages>
                        </Col>
                    </Row>
                </Tab.Container>
            </Container>

        </div>
    );
};

const WolfyNavbar = () => (
    <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
            <Navbar.Brand href="#home">Wolfy点歌机</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                    <Nav.Link href="#home">📖使用说明</Nav.Link>
                    <NavDropdown title="⚙️系统管理" id="basic-nav-dropdown">
                        <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                        <NavDropdown.Item href="#action/3.2">
                            Another action
                        </NavDropdown.Item>
                        <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                        <NavDropdown.Divider />
                        <NavDropdown.Item href="#action/3.4" onClick={async () => await api.event("主播", "clear_all_data", "0")}>
                            清空全部数据
                        </NavDropdown.Item>
                    </NavDropdown>
                </Nav>
            </Navbar.Collapse>
        </Container>
    </Navbar>
)