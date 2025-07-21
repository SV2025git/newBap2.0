import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit3 } from 'lucide-react';

const StationGraphic = ({ stations, onStationUpdate, onStationDelete }) => {
  const [hoveredStation, setHoveredStation] = useState(null);
  const [draggedStation, setDraggedStation] = useState(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartStation, setDragStartStation] = useState(0);
  const svgRef = useRef(null);

  // Calculate dimensions
  const svgWidth = 800;
  const svgHeight = 400;
  const margin = 50;
  const centerY = svgHeight / 2;
  
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

  return (
    <div className="w-full bg-white rounded-lg border overflow-hidden">
      <div className="p-4 bg-slate-50 border-b">
        <h3 className="font-medium text-sm text-muted-foreground">
          2D Querschnitt - Interaktiv (Ziehen zum Anpassen der Breite)
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
                    className="transition-all duration-200 cursor-grab active:cursor-grabbing"
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
                      
                      {/* Edit indicator */}
                      <circle
                        cx={x - 15}
                        cy={centerY - halfWidth - 15}
                        r="12"
                        fill="#3b82f6"
                        className="cursor-grab action-button"
                      />
                      <g className="cursor-grab action-button">
                        <line
                          x1={x - 19}
                          y1={centerY - halfWidth - 11}
                          x2={x - 15}
                          y2={centerY - halfWidth - 15}
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1={x - 15}
                          y1={centerY - halfWidth - 15}
                          x2={x - 11}
                          y2={centerY - halfWidth - 19}
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1={x - 11}
                          y1={centerY - halfWidth - 11}
                          x2={x - 15}
                          y2={centerY - halfWidth - 15}
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
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