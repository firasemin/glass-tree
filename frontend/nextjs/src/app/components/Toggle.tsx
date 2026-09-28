import React from 'react';
import './Toggle.css';

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string; 
}

export const ToggleSwitch = ({ label, checked, onChange, className = '' }: ToggleSwitchProps) => (
    <label className={`switch-label ${className}`}>
        <input 
            type="checkbox" 
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className='switch-checkbox'
        />
        <span className="switch-slider" />
        <span className="switch-text">{label}</span>
    </label>
);