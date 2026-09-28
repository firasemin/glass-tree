import React from 'react';
import './ColorLegend.css';

interface ColorLegendProps {
    colorMode: 'class' | 'purity' | 'feature' | 'none';
}

export const ColorLegend: React.FC<ColorLegendProps> = ({ colorMode }) => {
    if (colorMode === 'none') return null;

    const renderContent = () => {
        switch (colorMode) {
            case 'class':
                return (
                    <div className="legend-items">
                        <div className="legend-item">
                            <div className="color-dot" style={{ backgroundColor: '#c9184a' }}></div>
                            <span>Disease</span>
                        </div>
                        <div className="legend-item">
                            <div className="color-dot" style={{ backgroundColor: '#0eaa88' }}></div>
                            <span>No Disease</span>
                        </div>
                    </div>
                );
            case 'purity':
                return (
                    <div>
                        <div className="purity-gradient"></div>
                        <div className="purity-labels">
                            <span>Pure (0.0)</span>
                            <span>Impure (0.5)</span>
                        </div>
                    </div>
                );
            case 'feature':
                return (
                    <div className="legend-items">
                        <div className="legend-item">
                            <div className="color-dot" style={{ backgroundColor: '#2A9D8F' }}></div>
                            <span>Demographics</span>
                        </div>
                        <div className="legend-item">
                            <div className="color-dot" style={{ backgroundColor: '#F4A261' }}></div>
                            <span>Vitals</span>
                        </div>
                        <div className="legend-item">
                            <div className="color-dot" style={{ backgroundColor: '#E76F51' }}></div>
                            <span>Labs</span>
                        </div>
                        <div className="legend-item">
                            <div className="color-dot" style={{ backgroundColor: '#264653' }}></div>
                            <span>History</span>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getTitle = () => {
        switch (colorMode) {
            case 'class': return 'Class Map';
            case 'purity': return 'Gini Impurity';
            case 'feature': return 'Feature Categories';
            default: return '';
        }
    };

    return (
        <div className="color-legend">
            <div className="legend-title">{getTitle()}</div>
            {renderContent()}
        </div>
    );
};
