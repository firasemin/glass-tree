import { Panel } from "@xyflow/react";
import './TrashCan.css';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

interface TrashCanProps {
    isVisible: boolean;
    isDraggingNode: boolean;
    isHovered: boolean;
}

//Hovering needs to be improved.

export const TrashCan = ({ isVisible, isDraggingNode, isHovered }: TrashCanProps) => {

    if (!isVisible) return null;

    return (
        <Panel
            position="bottom-right"
            className="nopan z-10 trash-can-panel"
        >
            <div
                id="trash-can-zone"
                className={`trash-can-zone ${isHovered && isDraggingNode ? 'active' : ''}`}
            >
                <span className="trash-text">
                    Trash
                </span>
                <TrashIcon />
            </div>
        </Panel>
    );
}