'use client';
import React, { useState } from 'react';

export const RecentTrees = () => {
    const [isOpen, setIsOpen] = useState( false );

    return (
        <div style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
            <div
                onClick={() => setIsOpen( !isOpen )}
                style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', color: '#64748b' }}
            >
                <span>Recent Projects</span>
                <span>{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
                <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#94a3b8' }}>
                    No recent projects found.
                </div>
            )}
        </div>
    );
};