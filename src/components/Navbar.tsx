import { useEffect, useState } from "react"
import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap"
import { SysInfo } from "../models/SysInfo";
import { api } from "../services/api";
import { System } from "./system";

export const WolfyNavbar = () => {
    const [showSystem, setShowSystem] = useState<boolean>(false);
    const [sysInfo, setSysInfo] = useState({} as SysInfo);
    const refresh = async () => {
        try {
            const items = await api.sysInfo()
            setSysInfo(items);
        } catch (error) {
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
        <Navbar expand="lg" className="bg-body-tertiary">
            <Container>
                <System show={showSystem} sysInfo={sysInfo} close={() => setShowSystem(false)}></System>
                <Navbar.Brand href="#home">Wolfy点歌机</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <NavDropdown title="⚙️系统管理" id="basic-nav-dropdown">
                            <NavDropdown.Item onClick={() => setShowSystem(true)} >系统信息</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item href="#action/3.4" onClick={async () => await api.event("主播", "reboot", "0")}>
                                重启
                            </NavDropdown.Item>
                            <NavDropdown.Item href="#action/3.4" onClick={async () => await api.event("主播", "clear_all_data", "0")}>
                                清空全部数据
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}