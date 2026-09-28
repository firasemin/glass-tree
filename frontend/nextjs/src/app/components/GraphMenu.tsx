import { Panel, type Node, type Edge } from '@xyflow/react';
import { forwardRef, CSSProperties } from 'react';
import './GraphMenu.css';
import { ToggleSwitch } from './Toggle';

interface HistoryInfo {
  can_undo: boolean;
  can_redo: boolean;
  total_states: number;
  current_position: number;
}

interface GraphMenuProps {
  nodes: Node[];
  edges: Edge[];
  onLayoutChange: (direction: string) => void;
  onFitView: () => void;
  onResetLayout: () => void;

  colorMode: 'class' | 'purity' | 'feature' | 'none';
  onColorModeChange: (colorMode: 'class' | 'purity' | 'feature' | 'none') => void;

  // Undo/Redo props
  onUndo: () => void;
  onRedo: () => void;
  onResetTree: () => void;
  historyInfo: HistoryInfo;
  isSaving: boolean;
  style?: CSSProperties;
}

export const GraphMenu = forwardRef<HTMLDivElement, GraphMenuProps>(({
  nodes,
  edges,
  onLayoutChange,
  onFitView,
  onResetLayout,
  colorMode,
  onColorModeChange,
  onUndo,
  onRedo,
  onResetTree,
  historyInfo,
  isSaving,
  style
}, ref) => {

  return (
    <Panel
      position="top-right"
      className="graph-menu"
      ref={ref}
      style={{
        ...style,
        transformOrigin: 'top right' // Ensure scaling shrinks towards the corner
      }}
    >
      <h2>Graph Toolbox</h2>
      <div className="graph-menu-content">
        {/* 1. History Section (Undo/Redo) */}
        <div>
          <h3>History</h3>
          <div className="button-group">
            <button
              className="action-button"
              onClick={onUndo}
              disabled={!historyInfo.can_undo || isSaving}
              title="Undo last change"
            >
              ↶ Undo
            </button>
            <button
              className="action-button"
              onClick={onRedo}
              disabled={!historyInfo.can_redo || isSaving}
              title="Redo last undone change"
            >
              ↷ Redo
            </button>
          </div>
          <div className="history-info">
            {historyInfo.total_states > 0 && (
              <span>State {historyInfo.current_position} of {historyInfo.total_states}</span>
            )}
            {isSaving && <span className="saving-indicator">Saving...</span>}
          </div>
          <div className="button-group">
            <button
              className="action-button reset-tree"
              onClick={onResetTree}
              disabled={isSaving}
              title="Reset to initial tree (clears all history)"
            >
              Reset Tree
            </button>
          </div>
        </div>

        {/* 2. Layout Section */}
        <div>
          <h3>Layout</h3>
          <div className="button-group">
            <button
              className="action-button"
              onClick={() => onLayoutChange('TB')}
            >
              Vertical
            </button>
            <button
              className="action-button"
              onClick={() => onLayoutChange('LR')}
            >
              Horizontal
            </button>
          </div>
          <div className="button-group">
            <button
              className="action-button"
              onClick={onResetLayout}
              title="Snap nodes back to original positions"
            >
              Reset Layout
            </button>
            <button
              className="action-button"
              onClick={onFitView}
              title="Center the view on to the Tree"
            >
              Fit View
            </button>
          </div>
        </div>

        {/* 3. Analysis Section */}
        <h3>Analysis</h3>
        <div>
          <ToggleSwitch
            label="Class Color Map"
            checked={colorMode === 'class'}
            onChange={(isChecked) => onColorModeChange(isChecked ? 'class' : 'none')}
          />

          <ToggleSwitch
            label="Purity Color Map"
            checked={colorMode === 'purity'}
            onChange={(isChecked) => onColorModeChange(isChecked ? 'purity' : 'none')}
          />

          <ToggleSwitch
            label="Feature Categories"
            checked={colorMode === 'feature'}
            onChange={(isChecked) => onColorModeChange(isChecked ? 'feature' : 'none')}
          />
        </div>

      </div>

    </Panel>
  );
});

GraphMenu.displayName = 'GraphMenu';