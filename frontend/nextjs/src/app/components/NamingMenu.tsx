"use client";
import { CartesianGrid, Line, LineChart, XAxis, YAxis, LabelProps, Tooltip, ResponsiveContainer } from 'recharts';
import { forwardRef, CSSProperties } from "react";
import { Panel } from '@xyflow/react';
import './NamingMenu.css';



interface PerformanceProps {
  current?: number | null;
  history: { accuracy: number, timestamp: number }[]; // oldest -> newest
  onEvaluate?: () => Promise<void>;
  isEvaluating?: boolean;
  maxPoints?: number;
  style?: CSSProperties;
}

export const PerformanceMenu = forwardRef<HTMLDivElement, PerformanceProps>(({ current, history, onEvaluate, isEvaluating, maxPoints = 30, style }: PerformanceProps, ref) => {

  const visible = history.slice(-maxPoints);
  //const min = Math.min(...visible, 0);
  //const max = Math.max(...visible, 1);
  const width = 160;
  const height = 40;
  const pad = 4;
  /*
  const points = visible.map((v, i) => {
    const x = pad + (i / Math.max(1, visible.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / (max - min || 1)) * (height - pad * 2);
    return `${x},${y}`;
  }).join(' ');*/

  //better graph with recharts

  // Label on the dots, what to show how to show
  const CustomizedLabel = ({ x, y, stroke, value }: LabelProps) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={x} y={y} dy={-4} fill={stroke} fontSize={10} textAnchor="middle" transform="rotate(-15)">
          {value}
        </text>
      </g>
    );
  };

  // Ticks on X axis, we rotate them so that they fit better
  const CustomizedAxisTick = ({ x, y, payload }: any) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="end" fill="#666" transform="rotate(-35)">
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <Panel position="top-left" className="performance-menu"
      ref={ref}
      style={{
        ...style, transformOrigin: 'top left' // Ensure scaling shrinks towards the corner
      }}
    >

      <div className="naming-header">
        <div className="naming-title">Notes</div>
        <button className="save-btn" onClick={() => onEvaluate?.()} disabled={isEvaluating}>
          {isEvaluating ? 'Running…' : 'Save'}
        </button>
      </div>
      <div className="naming-body">
        <div className="naming-value">
          {current == null ? 'not found' : `${Math.round(current * 100)}%`}
        </div>

        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={history}
            margin={{
              top: 20,
              right: 5,
              left: 0,
              bottom: 5
            }}
          >
            <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            <XAxis dataKey="timestamp"
              tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
              tick={CustomizedAxisTick} />
            <YAxis width={30} domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} tick={{ fontSize: 9 }} />
            <Line type="monotone" dataKey="accuracy" stroke="#8884d8" activeDot={{ r: 8 }} label={CustomizedLabel} />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
});


/*
<svg width={width} height={height} className="performance-spark">
    <rect x={0} y={0} width={width} height={height} fill="transparent" />
    {points && <polyline fill="none" stroke="#2b6cb0" strokeWidth={2} points={points} />}
</svg>
*/ 