import Card from 'react-bootstrap/Card';
import { TicketItem } from '../models/Ticket';
import { Badge, Table } from 'react-bootstrap';
import { CoverInfoStyle, GenreInfoStyle, GenreInfoValue, SongInfoStyle, SongInfoValue } from '../themes/Maimai';
import { api } from '../services/api';

export interface TicketProps {
    ticket: TicketItem
    index: number

}

export function Ticket(props: TicketProps) {
    let { ticket, index } = props;
    const badgeStyle = { 
        cursor: "pointer",
        lineHeight: "11px",
        fontSize: 11,
        display: "inline-block",
        "--bs-badge-padding-x": "0.2em",
        "--bs-badge-padding-y": "0.1em",
        "--bs-card-spacer-y": "0em",
        "--bs-card-spacer-x": "0em",
        } as React.CSSProperties;

    const titleStyle = {
        width: "84px",
        "--bs-card-spacer-y": "0.0em",
        "--bs-card-spacer-x": "0.25em",
        } as React.CSSProperties;
    const creatorStyle = {
        width: "84px",
        "--bs-card-spacer-y": "0em",
        "--bs-card-spacer-x": "0em",
        } as React.CSSProperties;
    const trStyle = {
        lineHeight: "13.5px"
    }
    return (
        <Card>
            <div className="card-img-top" style={{
                aspectRatio: "1/1",
                width:"84px",
                backgroundSize: "contain",
                backgroundImage: `url(${ticket.image})`
            }} >
                <Table striped bordered hover size="sm" style={{marginBottom: 0, marginTop:0}}>
                    <tr style={trStyle} onClick={async () => await api.event("主播", "click_cover_info", `${index}`)}>
                        <Badge  bg='unknsown' style={{ ...badgeStyle, ...CoverInfoStyle(ticket.cover_info) }} title='删除'>{ticket.cover_info.toUpperCase()}</Badge>
                    </tr>
                    <tr style={trStyle}>&nbsp;</tr>
                    <tr style={trStyle}>&nbsp;</tr>
                    <tr style={trStyle}>&nbsp;</tr>
                    <tr style={trStyle}>&nbsp;</tr>
                    <tr style={trStyle}>
                        <Badge 
                            bg="unkno1wn" 
                            style={{ ...badgeStyle, ...GenreInfoStyle(ticket.genre_info)}}
                            onClick={async () => await api.event("主播", "click_genre_info", `${index}`)}
                            title="切换歌曲"
                            >
                                {GenreInfoValue(ticket.genre_info)}
                        </Badge>
                        <Badge
                            bg="unkno2wn"
                            style={{ ...badgeStyle, ...SongInfoStyle(ticket.song_info) }}
                            onClick={async () => await api.event("主播", "click_song_info", `${index}`)}
                            title="切换等级"
                            >
                            {SongInfoValue(ticket.song_info)}</Badge>
                    </tr>
                </Table>
            </div>
            <Card.Body style={{...titleStyle, ...SongInfoStyle(ticket.song_info)}}>
                <Table striped bordered hover size="sm" style={{marginBottom: 0, marginTop:0, "--bs-card-spacer-x": "0em",} as React.CSSProperties}>
                    <tr style={{lineHeight: "18px", "--bs-card-spacer-x": "0.25em", ...SongInfoStyle(ticket.song_info)} as React.CSSProperties}>
                        <marquee className="row g-0">{ticket.keyword} - {ticket.title}</marquee>
                    </tr>
                </Table>
            </Card.Body>
            <Card.Body style={{...creatorStyle, ...SongInfoStyle(ticket.song_info)}}>
                <Table striped bordered hover size="sm" style={{marginBottom: 0, marginTop:0, "--bs-card-spacer-x": "0em",} as React.CSSProperties}>
                    <tr style={{lineHeight: "18px", cursor: "pointer", backgroundColor: "#ffffff", color: "#000000"}}
                            onClick={async () => await api.event("主播", "click_creator", `${index}`)}>
                        {
                            ticket.creator.length > 4 ? 
                                <marquee className="row g-0"><small>{ticket.creator}</small></marquee>
                           : 
                                <small>{ticket.creator}</small>
                        }
                    </tr>
                </Table>
            </Card.Body>
        </Card>
    )
}