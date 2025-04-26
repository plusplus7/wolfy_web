import { Alert, CardGroup, ListGroup } from "react-bootstrap";
import { MessageItem } from "../models/Message";

export interface MessagesProps {
    messages: MessageItem[];
}

export function Messages(props: MessagesProps) {
    let {messages } =  props;
    if (!messages) {
        messages = [];
    }

    return (
        <ListGroup as="ul" style={{ width: "243px" }}>
            {
                messages && messages.map(
                    (msg: MessageItem, index: number) => (

                        <ListGroup.Item as="li" style={
                            {
                                paddingBlock: "unset",
                                paddingLeft: "unset"
                            }

                        }variant={msg.content.startsWith("inf ") ? "success" : 'danger'}>
                                &nbsp;{msg.content.startsWith("inf ") ? "✅" : '❌'} &nbsp;{msg.content.substring(4)}
                        </ListGroup.Item>
                    )
                )
            }
        </ListGroup>
    )
}