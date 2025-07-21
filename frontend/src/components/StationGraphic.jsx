import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit3 } from 'lucide-react';
import { Button } from './ui/button';

const StationGraphic = ({ stations, layers = [], sectionActivation = {}, zoomLevel = 1, showVoraufmass = true, showSchichten = true, onStationUpdate, onStationDelete, onSectionToggle }) => {
  const [hoveredStation, setHoveredStation] = useState(null);
  const [draggedStation, setDraggedStation] = useState(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartStation, setDragStartStation] = useState(0);
  const svgRef = useRef(null);

  // Calculate dimensions with zoom applied to height only
  const svgWidth = 800;
  const baseHeight = 300 * zoomLevel; // Apply zoom to height
  const totalLayerThickness = layers.reduce((sum, layer) => sum + Math.max(layer.dicke * 2 * zoomLevel, 25 * zoomLevel), 0); // Apply zoom to layer thickness
  const svgHeight = baseHeight + totalLayerThickness + (100 * zoomLevel); // Apply zoom to total height
  const margin = 50;
  const centerY = 150 * zoomLevel; // Apply zoom to center position
  
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

            {/* Layer visualization - rectangular blocks with uniform height */}
            {layers.map((layer, layerIndex) => {
              // Calculate cumulative thickness from bottom up
              const layersBelow = layers.slice(0, layerIndex);
              const cumulativeThickness = layersBelow.reduce((sum, l) => sum + Math.max(l.dicke * 2 * zoomLevel, 25 * zoomLevel), 0); // Apply zoom
              const layerStartY = centerY + (80 * zoomLevel) + cumulativeThickness; // Apply zoom to spacing
              const layerThickness = Math.max(layer.dicke * 2 * zoomLevel, 25 * zoomLevel); // Apply zoom to thickness
              const layerColor = layerColors[layerIndex % layerColors.length];
              
              // Calculate the width of the entire measurement area (from leftmost to rightmost station)
              const leftmostX = scaleX(minStation);
              const rightmostX = scaleX(maxStation);
              
              return (
                <g key={layer.id}>
                  {/* Full rectangular layer block */}
                  <rect
                    x={leftmostX}
                    y={layerStartY}
                    width={rightmostX - leftmostX}
                    height={layerThickness}
                    fill="#f1f5f9"
                    stroke={layerColor}
                    strokeWidth="2"
                    opacity="0.3"
                  />
                  
                  {/* Vertical station lines in layers */}
                  {stations.map((station) => {
                    const x = scaleX(station.station);
                    return (
                      <line
                        key={`station-line-${station.id}-${layer.id}`}
                        x1={x}
                        y1={layerStartY}
                        x2={x}
                        y2={layerStartY + layerThickness}
                        stroke="#64748b"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                    );
                  })}
                  
                  {/* Layer sections between stations - rectangular blocks only */}
                  {stations.slice(0, -1).map((station, stationIndex) => {
                    const nextStation = stations[stationIndex + 1];
                    const sectionKey = `${station.id}-${nextStation.id}`;
                    const isActive = sectionActivation[layer.id]?.[sectionKey];
                    
                    const x1 = scaleX(station.station);
                    const x2 = scaleX(nextStation.station);
                    
                    return (
                      <g key={sectionKey}>
                        {/* Rectangular section block */}
                        <rect
                          x={x1}
                          y={layerStartY}
                          width={x2 - x1}
                          height={layerThickness}
                          fill={isActive ? layerColor : '#e2e8f0'}
                          fillOpacity={isActive ? 0.8 : 0.5}
                          stroke={layerColor}
                          strokeWidth="1"
                          className="cursor-pointer transition-all duration-200"
                          onClick={() => onSectionToggle && onSectionToggle(layer.id, sectionKey)}
                        />
                        
                        {/* Section activation checkbox */}
                        <circle
                          cx={(x1 + x2) / 2}
                          cy={layerStartY + layerThickness / 2}
                          r={Math.max(6 * zoomLevel, 4)} // Scale checkbox with zoom
                          fill={isActive ? layerColor : '#94a3b8'}
                          className="cursor-pointer"
                          onClick={() => onSectionToggle && onSectionToggle(layer.id, sectionKey)}
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={layerStartY + layerThickness / 2 + (3 * zoomLevel)}
                          textAnchor="middle"
                          className="fill-white font-bold cursor-pointer pointer-events-none"
                          fontSize={Math.max(12 * zoomLevel, 8)}
                        >
                          {isActive ? '✓' : '○'}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Layer boundary lines */}
                  <line
                    x1={leftmostX}
                    y1={layerStartY}
                    x2={rightmostX}
                    y2={layerStartY}
                    stroke={layerColor}
                    strokeWidth="2"
                  />
                  <line
                    x1={leftmostX}
                    y1={layerStartY + layerThickness}
                    x2={rightmostX}
                    y2={layerStartY + layerThickness}
                    stroke={layerColor}
                    strokeWidth="2"
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
                    const halfWidth = (station.width * 20 * zoomLevel); // Apply zoom to width visualization
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
                    const halfWidth = (station.width * 20 * zoomLevel); // Apply zoom to width visualization
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
                    const halfWidth = (station.width * 20 * zoomLevel); // Apply zoom to width visualization
                    return `${index === 0 ? 'M' : 'L'} ${x} ${centerY - halfWidth}`;
                  }).join(' ')} ${stations.slice().reverse().map((station) => {
                    const x = scaleX(station.station);
                    const halfWidth = (station.width * 20 * zoomLevel); // Apply zoom to width visualization
                    return `L ${x} ${centerY + halfWidth}`;
                  }).join(' ')} Z`}
                  fill="rgba(59, 130, 246, 0.15)"
                  stroke="none"
                />

                {/* Top profile points */}
                {stations.map((station) => {
                  const x = scaleX(station.station);
                  const halfWidth = (station.width * 20 * zoomLevel); // Apply zoom to width visualization
                  return (
                    <circle
                      key={`top-${station.id}`}
                      cx={x}
                      cy={centerY - halfWidth}
                      r={4 * zoomLevel}
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Bottom profile points */}
                {stations.map((station) => {
                  const x = scaleX(station.station);
                  const halfWidth = (station.width * 20 * zoomLevel); // Apply zoom to width visualization
                  return (
                    <circle
                      key={`bottom-${station.id}`}
                      cx={x}
                      cy={centerY + halfWidth}
                      r={4 * zoomLevel}
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
              const halfWidth = (station.width * 20 * zoomLevel); // Apply zoom to width visualization
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
                    r={4 * zoomLevel}
                    fill="#1e293b"
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Station label */}
                  <text
                    x={x}
                    y={centerY + halfWidth + (20 * zoomLevel)}
                    textAnchor="middle"
                    className="fill-slate-600 font-medium"
                    fontSize={Math.max(12 * zoomLevel, 8)}
                  >
                    {station.station.toFixed(1)}m
                  </text>
                  
                  {/* Width label */}
                  <text
                    x={x}
                    y={centerY - halfWidth - (10 * zoomLevel)}
                    textAnchor="middle"
                    className="fill-slate-600 font-medium"
                    fontSize={Math.max(12 * zoomLevel, 8)}
                  >
                    {station.width.toFixed(1)}m
                  </text>
                  
                  {/* Action buttons on hover - scale with zoom */}
                  {isHovered && (
                    <g className="action-buttons">
                      {/* Delete button */}
                      <circle
                        cx={x + (15 * zoomLevel)}
                        cy={centerY - halfWidth - (15 * zoomLevel)}
                        r={12 * zoomLevel}
                        fill="#ef4444"
                        className="cursor-pointer hover:fill-red-600 transition-colors action-button"
                        onClick={() => onStationDelete(station.id)}
                      />
                      <g 
                        className="cursor-pointer action-button"
                        onClick={() => onStationDelete(station.id)}
                      >
                        <line
                          x1={x + (11 * zoomLevel)}
                          y1={centerY - halfWidth - (19 * zoomLevel)}
                          x2={x + (19 * zoomLevel)}
                          y2={centerY - halfWidth - (11 * zoomLevel)}
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1={x + (19 * zoomLevel)}
                          y1={centerY - halfWidth - (19 * zoomLevel)}
                          x2={x + (11 * zoomLevel)}
                          y2={centerY - halfWidth - (11 * zoomLevel)}
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </g>
                      
                      {/* Edit indicator - dual direction arrows */}
                      <circle
                        cx={x - (15 * zoomLevel)}
                        cy={centerY - halfWidth - (15 * zoomLevel)}
                        r={12 * zoomLevel}
                        fill="#3b82f6"
                        className="cursor-move action-button"
                      />
                      <g className="cursor-move action-button">
                        {/* Horizontal arrow */}
                        <line
                          x1={x - (21 * zoomLevel)}
                          y1={centerY - halfWidth - (15 * zoomLevel)}
                          x2={x - (9 * zoomLevel)}
                          y2={centerY - halfWidth - (15 * zoomLevel)}
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        {/* Arrow heads and vertical arrow scaled with zoom */}
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