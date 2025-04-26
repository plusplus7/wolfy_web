import { CardGroup } from "react-bootstrap";
import { TicketItem } from "../models/Ticket";
import { Ticket } from "./Ticket";

export interface TicketGroupProps {
    tickets: TicketItem[];
}

export function TicketGroup(props: TicketGroupProps) {
    let {tickets } =  props;
    if (!tickets) {
        tickets = [];
    }
    var groups: TicketItem[][] = [];
    const chunkSize = 3;
    for (let i = 0, j=0; i < tickets.length; i += chunkSize, j++) {
        const group = tickets.slice(i, i + chunkSize);
        groups[i] = group;
    }

    return (
        <div>
            {
                groups && groups.map(
                    (group: TicketItem[], row: number) => (
                        <CardGroup key={row} style={{width: "243px"}}>
                            {
                                group.map(
                                    (e: TicketItem, index: number) => <Ticket key={row + index} ticket={e} index={index + row}></Ticket>
                                )
                            }
                        </CardGroup>

                    )
                )
            }
        </div>
    )
}