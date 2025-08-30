import React from 'react';
import { GraphData } from '../types';

interface DataGraphProps {
    data: GraphData;
}

const DataGraph: React.FC<DataGraphProps> = ({ data }) => {
    if (!data || !data.data || data.data.length === 0) {
        return null;
    }
    
    // Currently only supports bar charts, can be expanded later.
    if (data.type !== 'bar') {
        return <p className="text-subtle text-sm">Chart type "{data.type}" is not supported yet.</p>;
    }

    const PADDING = { top: 20, right: 20, bottom: 50, left: 50 };
    const SVG_WIDTH = 500;
    const SVG_HEIGHT = 300;
    const CHART_WIDTH = SVG_WIDTH - PADDING.left - PADDING.right;
    const CHART_HEIGHT = SVG_HEIGHT - PADDING.top - PADDING.bottom;

    const maxValue = Math.max(...data.data.map(d => d.value), 0);
    const numYTicks = 5;
    const yAxisTicks = Array.from({ length: numYTicks + 1 }, (_, i) => {
        const value = (maxValue / numYTicks) * i;
        return value;
    });

    const BAR_WIDTH = CHART_WIDTH / data.data.length * 0.7;
    const BAR_SPACING = CHART_WIDTH / data.data.length * 0.3;

    return (
        <div className="w-full text-xs text-subtle">
            <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} role="figure" aria-labelledby="chart-title" className="w-full h-auto">
                <title id="chart-title">{data.config.title}</title>
                {/* Y-Axis */}
                <g className="y-axis" transform={`translate(${PADDING.left}, ${PADDING.top})`}>
                    {yAxisTicks.map((tick, i) => {
                        const y = CHART_HEIGHT - (tick / maxValue) * CHART_HEIGHT;
                        return (
                            <g key={i} transform={`translate(0, ${y})`}>
                                <line x1="-5" x2={CHART_WIDTH} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.3" />
                                <text
                                    x="-10"
                                    dy="0.32em"
                                    textAnchor="end"
                                    fill="currentColor"
                                    className="text-xs"
                                >
                                    {Math.round(tick)}
                                </text>
                            </g>
                        );
                    })}
                    <text
                        transform={`rotate(-90)`}
                        x={-CHART_HEIGHT / 2}
                        y={-PADDING.left + 15}
                        textAnchor="middle"
                        fill="currentColor"
                        className="font-semibold"
                    >
                        {data.config.yAxisLabel}
                    </text>
                </g>

                {/* X-Axis */}
                <g className="x-axis" transform={`translate(${PADDING.left}, ${PADDING.top + CHART_HEIGHT})`}>
                    <line x2={CHART_WIDTH} stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
                     {data.data.map((d, i) => {
                        const x = i * (BAR_WIDTH + BAR_SPACING) + (BAR_WIDTH + BAR_SPACING) / 2;
                        return (
                            <g key={i} transform={`translate(${x}, 0)`}>
                                <text
                                    y="15"
                                    textAnchor="middle"
                                    fill="currentColor"
                                    className="text-xs"
                                >
                                    {d.label}
                                </text>
                             </g>
                        );
                     })}
                     <text
                        x={CHART_WIDTH/2}
                        y={PADDING.bottom - 5}
                        textAnchor="middle"
                        fill="currentColor"
                        className="font-semibold"
                    >
                        {data.config.xAxisLabel}
                    </text>
                </g>

                {/* Bars */}
                <g className="bars" transform={`translate(${PADDING.left}, ${PADDING.top})`}>
                    {data.data.map((d, i) => {
                        const barHeight = maxValue === 0 ? 0 : (d.value / maxValue) * CHART_HEIGHT;
                        const x = i * (BAR_WIDTH + BAR_SPACING) + BAR_SPACING/2;
                        const y = CHART_HEIGHT - barHeight;
                        
                        return (
                            <g key={i} className="group" transform={`translate(${x}, ${y})`}>
                                <rect
                                    width={BAR_WIDTH}
                                    height={barHeight}
                                    className="fill-accent/60 group-hover:fill-highlight transition-colors duration-200"
                                />
                                <title>{`${d.label}: ${d.value}`}</title>
                            </g>
                        );
                    })}
                </g>
            </svg>
        </div>
    );
};

export default DataGraph;