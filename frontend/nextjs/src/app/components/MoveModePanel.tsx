import { Panel } from '@xyflow/react';
import './MoveModePanel.css';

interface MoveModeBannerProps {
  onCancel: () => void;
}

export const MoveModeBanner = ({ onCancel }: MoveModeBannerProps) => {
  return (
    <Panel position="top-center">
      <div className="move-mode-banner">
        <div className="move-mode-content">
          <h3 className="move-mode-title">
            Move Mode Active
          </h3>
          <span className="move-mode-description">
            Select a <strong>target node</strong> to attach subtree.
          </span>
        </div>

        <CancelButton onClick={onCancel} />
      </div>
    </Panel>
  );
};

// Internal component to handle hover state cleanly (now via CSS)
const CancelButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="cancel-button"
    >
      Cancel
    </button>
  );
};