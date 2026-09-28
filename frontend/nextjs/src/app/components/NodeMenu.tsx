import { useEffect, useState, forwardRef, CSSProperties } from "react";
import './NodeMenu.css';
import { RawTreeNode } from "../../utils/treeUtils";
import { SmartHistogramSlider, HistogramBin } from "./SmartHistogramSlider";
import { useNodes, Panel } from "@xyflow/react";
import * as Select from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';

// Use the same Next.js rewrite as the other tree requests.
const BACKEND_BASE_URL = '';

interface NodeMenuProps {
    onModify: (updates: Partial<RawTreeNode>) => void;
    onAdd: () => void;
    onMove: () => void;
    onDelete: () => void;
    onCut: () => void;
    style?: CSSProperties;
}

export const NodeMenu = forwardRef<HTMLDivElement, NodeMenuProps>(({ onModify, onAdd, onMove, onDelete, onCut, style }, ref) => {
    const nodes = useNodes();
    const selectedNode = nodes.find((n) => n.selected);
    const [inputValue, setInputValue] = useState('');

    // State for available features
    const [availableFeatures, setAvailableFeatures] = useState<string[]>([]);

    // State to track if the select menu is open (for icon swapping)
    const [isSelectOpen, setIsSelectOpen] = useState(false);

    const meta = selectedNode?.data?.meta as RawTreeNode | undefined;
    const isDecisionNode = meta?.feature !== undefined && meta?.feature !== null;

    const [histogramBins, setHistogramBins] = useState<HistogramBin[]>([]);

    // 1. Fetch available features from backend on mount
    useEffect(() => {
        const fetchFeatures = async () => {
            try {
                // Correct Endpoint: /tree/features
                const res = await fetch(`${BACKEND_BASE_URL}/tree/features`);
                if (res.ok) {
                    const data = await res.json();
                    setAvailableFeatures(data);
                } else {
                    console.warn("Failed to fetch features");
                }
            } catch (e) {
                console.error("Error fetching features:", e);
            }
        };

        fetchFeatures();
    }, []);

    useEffect(() => {
        if (!selectedNode || !meta) return;

        // Sync local input
        if (isDecisionNode) {
            setInputValue(meta.threshold?.toString() || '0');

            // FETCH HISTOGRAM DATA
            if (meta.feature) {
                const fetchDistribution = async () => {
                    try {
                        // Backend expects integer ID. Root node id is like "0_root" -> "0"
                        const nodeIdInt = parseInt(selectedNode.id.replace('_root', ''), 10);
                        const url = `${BACKEND_BASE_URL}/tree/node/${nodeIdInt}/feature/${meta.feature}/distribution`;
                        const res = await fetch(url);
                        if (res.ok) {
                            const data: HistogramBin[] = await res.json();
                            setHistogramBins(data);
                        } else {
                            console.warn("Failed to fetch histogram data");
                            setHistogramBins([]);
                        }
                    } catch (e) {
                        console.error("Error fetching histogram:", e);
                        setHistogramBins([]);
                    }
                };
                fetchDistribution();
            }

        } else {
            setInputValue(meta.class || '');
        }

    }, [selectedNode?.id, isDecisionNode, meta?.feature, meta?.threshold, meta?.class]);

    const handleSave = (event: React.FormEvent) => {
        event.preventDefault();
        if (isDecisionNode) {
            const numVal = parseFloat(inputValue);
            if (!isNaN(numVal)) {
                onModify({ threshold: numVal });
            }
        }
    };

    const handleOutcomeClick = (outcome: string) => {
        onModify({
            class: outcome
        });
    };

    const handleFeatureChange = (newValue: string) => {
        onModify({ feature: newValue });
    };

    if (!selectedNode) return null;

    return (
        <Panel
            position="bottom-right"
            className="nopan"
            ref={ref}
            style={{
                ...style,
                transformOrigin: 'bottom right'
            }}
        >
            <div className="node-toolbox-container">
                <h2>Node Toolbox</h2>

                <form onSubmit={handleSave} className="node-toolbox-form">
                    {isDecisionNode && (
                        <div className="slider-container">

                            {/* Feature Selection - Header + Full Width Select */}
                            <div className="feature-selection-block">
                                <h3>Feature</h3>

                                <Select.Root
                                    value={meta?.feature || ''}
                                    onValueChange={handleFeatureChange}
                                    open={isSelectOpen}
                                    onOpenChange={setIsSelectOpen}
                                >
                                    <Select.Trigger className="SelectTrigger">
                                        <Select.Value placeholder="Select feature..." />
                                        <Select.Icon className="SelectIcon">
                                            {isSelectOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                        </Select.Icon>
                                    </Select.Trigger>

                                    <Select.Portal>
                                        <Select.Content className="SelectContent" position="popper" sideOffset={5}>
                                            <Select.ScrollUpButton className="SelectScrollButton">
                                                <ChevronUpIcon />
                                            </Select.ScrollUpButton>

                                            <Select.Viewport className="SelectViewport">
                                                {availableFeatures.map((feat) => (
                                                    <Select.Item key={feat} value={feat} className="SelectItem">
                                                        <Select.ItemText>{feat}</Select.ItemText>
                                                        <Select.ItemIndicator className="SelectItemIndicator">
                                                            <CheckIcon />
                                                        </Select.ItemIndicator>
                                                    </Select.Item>
                                                ))}
                                            </Select.Viewport>

                                            <Select.ScrollDownButton className="SelectScrollButton">
                                                <ChevronDownIcon />
                                            </Select.ScrollDownButton>
                                        </Select.Content>
                                    </Select.Portal>
                                </Select.Root>
                            </div>

                            <h3>Adjust Threshold</h3>
                            <div className="slider-row">
                                <div className="slider-row">
                                    <SmartHistogramSlider
                                        bins={histogramBins}
                                        currentThreshold={parseFloat(inputValue) || 0}
                                        min={0}
                                        max={Math.max(10, (meta?.threshold || 0) * 2)}
                                        onThresholdChange={(val) => setInputValue(val.toString())}
                                    />
                                </div>
                            </div>
                            <div className="input-action-row">
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Threshold Value"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    className="node-toolbox-input"
                                    style={{ flex: 1 }}
                                />
                                <button type="submit" className="node-toolbox-save-button">
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Binary Outcome Toggle */}
                    <div className="outcome-section">
                        <h3>Set Class</h3>
                        <div className="outcome-toggle-container">
                            <button
                                type="button"
                                className={`outcome-button no-disease ${meta?.class === 'No Disease' ? 'active' : ''}`}
                                onClick={() => handleOutcomeClick('No Disease')}
                            >
                                No Disease
                            </button>
                            <button
                                type="button"
                                className={`outcome-button disease ${meta?.class === 'Disease' ? 'active' : ''}`}
                                onClick={() => handleOutcomeClick('Disease')}
                            >
                                Disease
                            </button>
                        </div>
                    </div>
                </form>

                <h3>Actions</h3>
                <div className="toolbox-actions">
                    <button onClick={onAdd} className="action-button add-child">Add Child</button>
                    <button onClick={onCut} className="action-button cut">Cut</button>
                    <button onClick={onMove} className="action-button move">Move</button>
                    <button onClick={onDelete} className="action-button delete">Delete</button>
                </div>
            </div>
        </Panel>
    );
});

NodeMenu.displayName = 'NodeMenu';
