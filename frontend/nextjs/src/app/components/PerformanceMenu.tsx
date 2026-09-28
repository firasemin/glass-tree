"use client";
import { Panel } from '@xyflow/react';
import './PerformanceMenu.css';

interface Props {
  current?: number | null;
  history: number[]; // oldest -> newest
  onEvaluate?: () => Promise<void>;
  isEvaluating?: boolean;
  maxPoints?: number;
}

export const PerformanceMenu = ({ current, history, onEvaluate, isEvaluating, maxPoints = 30 }: Props) => {
  const visible = history.slice(-maxPoints);
  const min = Math.min(...visible, 0);
  const max = Math.max(...visible, 1);
  const width = 160;
  const height = 40;
  const pad = 4;

  const points = visible.map((v, i) => {
    const x = pad + (i / Math.max(1, visible.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / (max - min || 1)) * (height - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <Panel position="top-left" className="performance-menu">
      <h2>Performance</h2>

      <div className="performance-content-box">
        {(points && history.length > 0) ? (
          <div className="performance-body">
            <div className="performance-value">
              {current == null ? 'evaluate' : `${Math.round(current * 100)}%`}
            </div>
            <svg width={width} height={height} className="performance-spark">
              <rect x={0} y={0} width={width} height={height} fill="transparent" />
              <polyline fill="none" stroke="#2b6cb0" strokeWidth={2} points={points} />
            </svg>
          </div>
        ) : (
          <div className="performance-empty-state">
            none
          </div>
        )}
      </div>

      <div className="performance-actions">
        <button className="action-button evaluate-btn" onClick={() => onEvaluate?.()} disabled={isEvaluating}>
          {isEvaluating ? 'Running…' : 'Evaluate'}
        </button>
      </div>
    </Panel>
  );
};

