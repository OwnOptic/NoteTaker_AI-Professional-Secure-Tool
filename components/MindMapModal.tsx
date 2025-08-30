import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Note, Project } from '../types';
import { IconClose, IconBrainCircuit } from './Icons';
import MindMapNodeComponent from './MindMapNodeComponent';
import { useFocusTrap } from '../hooks/useFocusTrap';

export interface MindMapNode extends Note {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface MindMapEdge {
    sourceId: string;
    targetId: string;
}

interface MindMapModalProps {
    isOpen: boolean;
    onClose: () => void;
    notes: Note[];
    projects: Project[];
    onSelectNote: (id: string) => void;
}

const calculateLayout = (notes: Note[], projects: Project[]): MindMapNode[] => {
    const positionedNotes: MindMapNode[] = [];
    if (notes.length === 0) return [];
    
    const NODE_WIDTH = 200;
    const NODE_HEIGHT = 100;

    const projectClusters = projects.map(p => ({
        ...p,
        notes: notes.filter(n => n.projectId === p.id)
    })).filter(pc => pc.notes.length > 0);

    const numClusters = projectClusters.length;
    const CLUSTER_SPACING = 600; 
    const clustersPerRow = Math.ceil(Math.sqrt(numClusters));
    
    projectClusters.forEach((cluster, clusterIndex) => {
        const clusterRow = Math.floor(clusterIndex / clustersPerRow);
        const clusterCol = clusterIndex % clustersPerRow;
        
        const clusterCenterX = clusterCol * CLUSTER_SPACING;
        const clusterCenterY = clusterRow * CLUSTER_SPACING;

        const numNotes = cluster.notes.length;
        const NOTE_RADIUS = 250;
        const angleStep = numNotes > 1 ? (2 * Math.PI) / numNotes : 0;
        
        cluster.notes.forEach((note, noteIndex) => {
            const x = clusterCenterX + (numNotes > 1 ? Math.cos(noteIndex * angleStep) * NOTE_RADIUS : 0);
            const y = clusterCenterY + (numNotes > 1 ? Math.sin(noteIndex * angleStep) * NOTE_RADIUS : 0);
            
            positionedNotes.push({
                ...note,
                x, y,
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
            });
        });
    });

    return positionedNotes;
};

const MindMapModal: React.FC<MindMapModalProps> = ({ isOpen, onClose, notes, projects, onSelectNote }) => {
    const [view, setView] = useState({ x: 0, y: 0, scale: 0.8 });
    const [isPanning, setIsPanning] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const svgRef = useRef<SVGSVGElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const [mapNodes, setMapNodes] = useState<MindMapNode[]>([]);

    useFocusTrap(modalRef, isOpen, onClose);

    useEffect(() => {
        if (isOpen) {
            const calculatedNodes = calculateLayout(notes, projects);
            setMapNodes(calculatedNodes);
            // Center view on initial load
            const allX = calculatedNodes.map(n => n.x);
            const allY = calculatedNodes.map(n => n.y);
            if (allX.length > 0) {
              const avgX = allX.reduce((a, b) => a + b, 0) / allX.length;
              const avgY = allY.reduce((a, b) => a + b, 0) / allY.length;
              setView(v => ({...v, x: -avgX * v.scale + window.innerWidth / 2, y: -avgY * v.scale + window.innerHeight / 2}));
            } else {
              setView(v => ({...v, x: window.innerWidth/2, y: window.innerHeight/2}));
            }
        }
    }, [isOpen, notes, projects]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const { clientX, clientY, deltaY } = e;
        const scaleAmount = -deltaY * 0.001;
        const newScale = Math.max(0.2, Math.min(2.5, view.scale + scaleAmount));
        
        const worldX = (clientX - view.x) / view.scale;
        const worldY = (clientY - view.y) / view.scale;

        const newX = clientX - worldX * newScale;
        const newY = clientY - worldY * newScale;

        setView({ x: newX, y: newY, scale: newScale });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.target === svgRef.current) {
            setIsPanning(true);
            setDragStart({ x: e.clientX - view.x, y: e.clientY - view.y });
        }
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isPanning) {
            setView(v => ({ ...v, x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }));
        }
    };
    const handleMouseUp = () => setIsPanning(false);

    const handleNodeMove = (id: string, newPos: { x: number, y: number }) => {
        setMapNodes(currentNodes => currentNodes.map(n => n.id === id ? { ...n, x: newPos.x, y: newPos.y } : n));
    };

    const mapEdges = useMemo<MindMapEdge[]>(() => {
        const edges: MindMapEdge[] = [];
        if (mapNodes.length === 0) return [];

        const titleToIdMap = new Map(mapNodes.map(n => [n.title.toLowerCase(), n.id]));
        const linkRegex = /\[\[(.*?)\]\]/g;

        for (const sourceNode of mapNodes) {
            const matches = [...sourceNode.content.matchAll(linkRegex)];
            for (const match of matches) {
                const targetTitle = match[1].toLowerCase();
                const targetId = titleToIdMap.get(targetTitle);
                if (targetId && targetId !== sourceNode.id) {
                    edges.push({ sourceId: sourceNode.id, targetId });
                }
            }
        }
        return edges;
    }, [mapNodes]);
    
    if (!isOpen) return null;

    return (
        <div 
            ref={modalRef}
            className="fixed inset-0 bg-primary/80 backdrop-blur-sm z-50 flex flex-col font-sans text-light animate-fade-in"
            role="dialog" aria-modal="true" aria-labelledby="mindmap-title"
        >
            <header className="p-4 flex justify-between items-center absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-primary to-transparent">
                <div className="flex items-center gap-3">
                    <IconBrainCircuit className="w-8 h-8 text-accent"/>
                    <h2 id="mindmap-title" className="text-xl font-bold">Mind Map</h2>
                </div>
                 <button onClick={onClose} className="p-2 rounded-full bg-secondary/50 hover:bg-secondary" aria-label="Close Mind Map"><IconClose className="w-6 h-6"/></button>
            </header>
            
            <svg
                ref={svgRef}
                className="w-full h-full cursor-grab"
                style={{ background: `radial-gradient(circle, #1f2937 1px, transparent 1px)`, backgroundSize: '20px 20px' }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <g transform={`translate(${view.x}, ${view.y}) scale(${view.scale})`}>
                    {mapEdges.map((edge, index) => {
                        const sourceNode = mapNodes.find(n => n.id === edge.sourceId);
                        const targetNode = mapNodes.find(n => n.id === edge.targetId);
                        if (!sourceNode || !targetNode) return null;

                        return (
                            <line
                                key={`${edge.sourceId}-${edge.targetId}-${index}`}
                                x1={sourceNode.x + sourceNode.width / 2}
                                y1={sourceNode.y + sourceNode.height / 2}
                                x2={targetNode.x + targetNode.width / 2}
                                y2={targetNode.y + targetNode.height / 2}
                                stroke="rgba(107, 114, 128, 0.4)" // subtle
                                strokeWidth="2"
                            />
                        );
                    })}
                    {mapNodes.map(node => (
                        <MindMapNodeComponent
                            key={node.id}
                            node={node}
                            onNodeMove={handleNodeMove}
                            onSelectNote={onSelectNote}
                            canvasTransform={view}
                        />
                    ))}
                </g>
            </svg>
            <style>{`
                @keyframes fade-in { 
                  from { opacity: 0; } to { opacity: 1; } 
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default MindMapModal;