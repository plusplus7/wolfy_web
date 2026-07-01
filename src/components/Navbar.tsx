import { Navbar, Container, Nav } from "react-bootstrap"

export const WolfyNavbar = () => {
   
    return (
        <Navbar expand="lg" className="bg-body-tertiary">
            <Container>
                <Navbar.Brand href="#/static">Wolfy点歌机</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="#/static">点歌管理</Nav.Link>
                        <Nav.Link href="#/system">系统管理</Nav.Link>
                        <Nav.Link href="#/stage">舞台页</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
