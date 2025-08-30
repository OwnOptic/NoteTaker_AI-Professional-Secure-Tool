import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MindMapNode } from './MindMapModal';
import { IconFileText } from './Icons';

interface MindMapNodeProps {
    node: MindMapNode;
    onNodeMove: (id: string, pos: { x: number, y: number }) => void;
    onSelectNote: (id: string) => void;
    canvasTransform: { scale: number, x: number, y: number };
}

const MindMapNodeComponent: React.FC<MindMapNodeProps> = ({ node, onNodeMove, onSelectNote, canvasTransform }) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });
    const hasDragged = useRef(false);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setIsDragging(true);
        hasDragged.current = false;
        // Position relative to the canvas, not the node itself
        dragStartPos.current = {
            x: e.clientX / canvasTransform.scale - node.x,
            y: e.clientY / canvasTransform.scale - node.y
        };
    }, [canvasTransform.scale, node.x, node.y]);
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            hasDragged.current = true;
            
            const newX = e.clientX / canvasTransform.scale - dragStartPos.current.x;
            const newY = e.clientY / canvasTransform.scale - dragStartPos.current.y;
            onNodeMove(node.id, { x: newX, y: newY });
        };
        
        const handleMouseUp = (e: MouseEvent) => {
            if (isDragging && !hasDragged.current) {
                // This was a click, not a drag
                onSelectNote(node.id);
            }
            setIsDragging(false);
        };
        
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, onNodeMove, node.id, canvasTransform.scale, onSelectNote]);

    return (
        <g
            transform={`translate(${node.x}, ${node.y})`}
            className={`cursor-pointer group transition-transform duration-100 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
        >
            <rect
                width={node.width}
                height={node.height}
                rx="8"
                ry="8"
                fill="#1F2937" // secondary
                stroke="#6D28D9" // accent
                strokeWidth={isDragging ? 4 : 2}
                className="transition-all duration-200 group-hover:stroke-highlight"
            />
            <foreignObject x="0" y="0" width={node.width} height={node.height}>
                <div className="p-3 text-light flex flex-col h-full overflow-hidden">
                    <h3 className="font-bold text-sm truncate flex items-center gap-1.5">
                       <IconFileText className="w-4 h-4 text-highlight shrink-0" />
                       <span className="truncate">{node.title}</span>
                    </h3>
                    <p className="text-xs text-subtle mt-1.5 leading-snug" style={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3, overflow: 'hidden' }}>
                        {node.summary}
                    </p>
                </div>
            </foreignObject>
        </g>
    );
};

export default MindMapNodeComponent;