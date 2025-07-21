import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit3 } from 'lucide-react';
import { Button } from './ui/button';

const StationGraphic = ({ stations, layers = [], sectionActivation = {}, onStationUpdate, onStationDelete, onSectionToggle }) => {
  const [hoveredStation, setHoveredStation] = useState(null);
  const [draggedStation, setDraggedStation] = useState(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartStation, setDragStartStation] = useState(0);
  const svgRef = useRef(null);

  // Calculate dimensions
  const svgWidth = 800;
  const baseHeight = 400;
  const layerHeight = layers.length * 80; // 80px per layer
  const svgHeight = baseHeight + layerHeight;
  const margin = 50;
  const centerY = 200; // Fixed center for main profile
  
  // Find min/max stations for scaling
  const minStation = stations.length > 0 ? Math.min(...stations.map(s => s.station)) : 0;
  const maxStation = stations.length > 0 ? Math.max(...stations.map(s => s.station)) : 1;
  const stationRange = maxStation - minStation || 1;
  
  // Scale function for station positions
  const scaleX = (station) => {
    return margin + ((station - minStation) / stationRange) * (svgWidth - 2 * margin);
  };

  // Handle drag start
  const handleMouseDown = (e, station) => {
    if (e.target.closest('.action-button')) return; // Don't drag when clicking action buttons
    
    setDraggedStation(station);
    setDragStartY(e.clientY);
    setDragStartWidth(station.width);
    
    // Store initial mouse X position and station position for horizontal dragging
    const rect = svgRef.current.getBoundingClientRect();
    const initialX = e.clientX - rect.left;
    setDragStartX(initialX);
    setDragStartStation(station.station);
    
    e.preventDefault();
  };

  // Handle drag move
  const handleMouseMove = (e) => {
    if (!draggedStation) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY;
    
    const deltaX = currentX - dragStartX;
    const deltaY = dragStartY - currentY; // Inverted for intuitive dragging
    
    // Determine drag direction based on larger movement
    const isDraggingHorizontally = Math.abs(deltaX) > Math.abs(deltaY);
    
    if (isDraggingHorizontally) {
      // Horizontal drag - adjust station position
      const stationDelta = (deltaX / (svgWidth - 2 * margin)) * stationRange;
      const newStation = Math.max(0, dragStartStation + stationDelta);
      onStationUpdate(draggedStation.id, 'station', newStation);
    } else {
      // Vertical drag - adjust width
      const widthChange = deltaY * 0.02; // Scale factor for sensitivity
      const newWidth = Math.max(0.1, dragStartWidth + widthChange);
      onStationUpdate(draggedStation.id, 'width', newWidth);
    }
  };

  // Handle drag end
  const handleMouseUp = () => {
    setDraggedStation(null);
    setDragStartY(0);
    setDragStartWidth(0);
    setDragStartX(0);
    setDragStartStation(0);
  };

  useEffect(() => {
    if (draggedStation) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedStation, dragStartY, dragStartWidth, dragStartX, dragStartStation]);

  // Calculate area between two stations (trapezoidal area)
  const calculateSectionArea = (station1, station2) => {
    const distance = Math.abs(station2.station - station1.station);
    const avgWidth = (station1.width + station2.width) / 2;
    return distance * avgWidth;
  };

  // Color palette for layers
  const layerColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  return (
    <div className="w-full bg-white rounded-lg border overflow-hidden">
      <div className="p-4 bg-slate-50 border-b">
        <h3 className="font-medium text-sm text-muted-foreground">
          2D Querschnitt mit Schichten - Interaktiv (Horizontal ziehen = Station verschieben, Vertikal ziehen = Breite anpassen)
        </h3>
      </div>
      
      <div className="p-4">
        {stations.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Keine Stationen vorhanden
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={svgWidth}
            height={svgHeight}
            className="w-full h-auto border rounded"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          >
            {/* Background grid */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Center line */}
            <line
              x1={margin}
              y1={centerY}
              x2={svgWidth - margin}
              y2={centerY}
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {/* Layer visualization - stacked sandwich style */}
            {layers.map((layer, layerIndex) => {
              // Calculate cumulative thickness from bottom up
              const layersBelow = layers.slice(0, layerIndex);
              const cumulativeThickness = layersBelow.reduce((sum, l) => sum + Math.max(l.dicke * 100, 30), 0); // Minimum 30px height
              const layerStartY = centerY + 120 + cumulativeThickness; // More space from initial measurement (120px instead of 50px)
              const layerThickness = Math.max(layer.dicke * 100, 30); // Minimum 30px thickness to fit checkbox
              const layerColor = layerColors[layerIndex % layerColors.length];
              
              return (
                <g key={layer.id}>
                  {/* Layer label */}
                  <text
                    x={10}
                    y={layerStartY + layerThickness / 2 + 5}
                    className="text-xs fill-slate-600 font-medium"
                  >
                    {layer.name} ({layer.dicke}m)
                  </text>
                  
                  {/* Layer sections between stations - no gaps */}
                  {stations.slice(0, -1).map((station, stationIndex) => {
                    const nextStation = stations[stationIndex + 1];
                    const sectionKey = `${station.id}-${nextStation.id}`;
                    const isActive = sectionActivation[layer.id]?.[sectionKey];
                    
                    const x1 = scaleX(station.station);
                    const x2 = scaleX(nextStation.station);
                    const width1 = station.width * 20;
                    const width2 = nextStation.width * 20;
                    
                    return (
                      <g key={sectionKey}>
                        {/* Layer section as solid rectangle - trapezoidal shape following profile */}
                        <path
                          d={`M ${x1 - width1/2} ${layerStartY} 
                              L ${x2 - width2/2} ${layerStartY}
                              L ${x2 + width2/2} ${layerStartY}
                              L ${x1 + width1/2} ${layerStartY}
                              L ${x1 + width1/2} ${layerStartY + layerThickness}
                              L ${x2 + width2/2} ${layerStartY + layerThickness}
                              L ${x2 - width2/2} ${layerStartY + layerThickness}
                              L ${x1 - width1/2} ${layerStartY + layerThickness} Z`}
                          fill={isActive ? layerColor : '#e2e8f0'}
                          fillOpacity={isActive ? 0.8 : 0.3}
                          stroke={layerColor}
                          strokeWidth="1"
                          className="cursor-pointer transition-all duration-200"
                          onClick={() => onSectionToggle && onSectionToggle(layer.id, sectionKey)}
                        />
                        
                        {/* Section activation button - larger radius for better fit */}
                        <circle
                          cx={(x1 + x2) / 2}
                          cy={layerStartY + layerThickness / 2}
                          r="10"
                          fill={isActive ? layerColor : '#94a3b8'}
                          className="cursor-pointer"
                          onClick={() => onSectionToggle && onSectionToggle(layer.id, sectionKey)}
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={layerStartY + layerThickness / 2 + 4}
                          textAnchor="middle"
                          className="text-sm fill-white font-bold cursor-pointer pointer-events-none"
                        >
                          {isActive ? '✓' : '○'}
                        </text>
                        
                        {/* Area display below layer */}
                        <text
                          x={(x1 + x2) / 2}
                          y={layerStartY + layerThickness + 15}
                          textAnchor="middle"
                          className="text-xs fill-slate-600"
                        >
                          {isActive ? `${calculateSectionArea(station, nextStation).toFixed(1)}m²` : '-'}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Layer boundary lines for sandwich effect */}
                  <line
                    x1={margin}
                    y1={layerStartY}
                    x2={svgWidth - margin}
                    y2={layerStartY}
                    stroke={layerColor}
                    strokeWidth="2"
                    opacity="0.7"
                  />
                  <line
                    x1={margin}
                    y1={layerStartY + layerThickness}
                    x2={svgWidth - margin}
                    y2={layerStartY + layerThickness}
                    stroke={layerColor}
                    strokeWidth="2"
                    opacity="0.7"
                  />
                </g>
              );
            })}
            
            {/* Profile lines connecting station tops and bottoms */}
            {stations.length > 1 && (
              <>
                {/* Top profile line */}
                <path
                  d={stations.map((station, index) => {
                    const x = scaleX(station.station);
                    const halfWidth = (station.width * 20);
                    return `${index === 0 ? 'M' : 'L'} ${x} ${centerY - halfWidth}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                
                {/* Bottom profile line */}
                <path
                  d={stations.map((station, index) => {
                    const x = scaleX(station.station);
                    const halfWidth = (station.width * 20);
                    return `${index === 0 ? 'M' : 'L'} ${x} ${centerY + halfWidth}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                
                {/* Fill area between the profile lines */}
                <path
                  d={`${stations.map((station, index) => {
                    const x = scaleX(station.station);
                    const halfWidth = (station.width * 20);
                    return `${index === 0 ? 'M' : 'L'} ${x} ${centerY - halfWidth}`;
                  }).join(' ')} ${stations.slice().reverse().map((station) => {
                    const x = scaleX(station.station);
                    const halfWidth = (station.width * 20);
                    return `L ${x} ${centerY + halfWidth}`;
                  }).join(' ')} Z`}
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke="none"
                />

                {/* Top profile points */}
                {stations.map((station) => {
                  const x = scaleX(station.station);
                  const halfWidth = (station.width * 20);
                  return (
                    <circle
                      key={`top-${station.id}`}
                      cx={x}
                      cy={centerY - halfWidth}
                      r="4"
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Bottom profile points */}
                {stations.map((station) => {
                  const x = scaleX(station.station);
                  const halfWidth = (station.width * 20);
                  return (
                    <circle
                      key={`bottom-${station.id}`}
                      cx={x}
                      cy={centerY + halfWidth}
                      r="4"
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}
              </>
            )}

            {/* Station markers and widths */}
            {stations.map((station) => {
              const x = scaleX(station.station);
              const halfWidth = (station.width * 20); // Scale factor for visual width
              const isHovered = hoveredStation === station.id;
              const isDragged = draggedStation?.id === station.id;
              
              return (
                <g key={station.id}>
                  {/* Width representation (vertical bar) */}
                  <rect
                    x={x - 3}
                    y={centerY - halfWidth}
                    width="6"
                    height={halfWidth * 2}
                    fill={isDragged ? "#3b82f6" : isHovered ? "#60a5fa" : "#94a3b8"}
                    stroke={isDragged ? "#1d4ed8" : isHovered ? "#3b82f6" : "#64748b"}
                    strokeWidth="2"
                    className="transition-all duration-200 cursor-move active:cursor-grabbing"
                    onMouseDown={(e) => handleMouseDown(e, station)}
                    onMouseEnter={() => setHoveredStation(station.id)}
                    onMouseLeave={() => setHoveredStation(null)}
                  />
                  
                  {/* Station point */}
                  <circle
                    cx={x}
                    cy={centerY}
                    r="4"
                    fill="#1e293b"
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Station label */}
                  <text
                    x={x}
                    y={centerY + halfWidth + 20}
                    textAnchor="middle"
                    className="text-xs fill-slate-600 font-medium"
                  >
                    {station.station.toFixed(1)}m
                  </text>
                  
                  {/* Width label */}
                  <text
                    x={x}
                    y={centerY - halfWidth - 10}
                    textAnchor="middle"
                    className="text-xs fill-slate-600 font-medium"
                  >
                    {station.width.toFixed(1)}m
                  </text>
                  
                  {/* Action buttons on hover */}
                  {isHovered && (
                    <g className="action-buttons">
                      {/* Delete button */}
                      <circle
                        cx={x + 15}
                        cy={centerY - halfWidth - 15}
                        r="12"
                        fill="#ef4444"
                        className="cursor-pointer hover:fill-red-600 transition-colors action-button"
                        onClick={() => onStationDelete(station.id)}
                      />
                      <g 
                        className="cursor-pointer action-button"
                        onClick={() => onStationDelete(station.id)}
                      >
                        <line
                          x1={x + 11}
                          y1={centerY - halfWidth - 19}
                          x2={x + 19}
                          y2={centerY - halfWidth - 11}
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1={x + 19}
                          y1={centerY - halfWidth - 19}
                          x2={x + 11}
                          y2={centerY - halfWidth - 11}
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </g>
                      
                      {/* Edit indicator - dual direction arrows */}
                      <circle
                        cx={x - 15}
                        cy={centerY - halfWidth - 15}
                        r="12"
                        fill="#3b82f6"
                        className="cursor-move action-button"
                      />
                      <g className="cursor-move action-button">
                        {/* Horizontal arrow */}
                        <line
                          x1={x - 21}
                          y1={centerY - halfWidth - 15}
                          x2={x - 9}
                          y2={centerY - halfWidth - 15}
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d={`M ${x - 11} ${centerY - halfWidth - 17} L ${x - 9} ${centerY - halfWidth - 15} L ${x - 11} ${centerY - halfWidth - 13}`}
                          stroke="white"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d={`M ${x - 19} ${centerY - halfWidth - 17} L ${x - 21} ${centerY - halfWidth - 15} L ${x - 19} ${centerY - halfWidth - 13}`}
                          stroke="white"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Vertical arrow */}
                        <line
                          x1={x - 15}
                          y1={centerY - halfWidth - 21}
                          x2={x - 15}
                          y2={centerY - halfWidth - 9}
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d={`M ${x - 17} ${centerY - halfWidth - 11} L ${x - 15} ${centerY - halfWidth - 9} L ${x - 13} ${centerY - halfWidth - 11}`}
                          stroke="white"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d={`M ${x - 17} ${centerY - halfWidth - 19} L ${x - 15} ${centerY - halfWidth - 21} L ${x - 13} ${centerY - halfWidth - 19}`}
                          stroke="white"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    </g>
                  )}
                </g>
              );
            })}
            
            {/* Scale indicators */}
            <g className="scale-indicators">
              <text x={margin} y={svgHeight - 10} className="text-xs fill-slate-500">
                {minStation.toFixed(1)}m
              </text>
              <text x={svgWidth - margin} y={svgHeight - 10} textAnchor="end" className="text-xs fill-slate-500">
                {maxStation.toFixed(1)}m
              </text>
            </g>
          </svg>
        )}
      </div>
    </div>
  );
};

export default StationGraphic;