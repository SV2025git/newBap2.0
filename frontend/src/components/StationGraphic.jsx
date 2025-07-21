import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit3 } from 'lucide-react';
import { Button } from './ui/button';

const StationGraphic = ({ stations, layers = [], sectionActivation = {}, zoomLevel = 1, showVoraufmass = true, showSchichten = true, showPOI = true, pointsOfInterest = [], poiTypes = {}, onStationUpdate, onStationDelete, onSectionToggle }) => {
  const [hoveredStation, setHoveredStation] = useState(null);
  const [draggedStation, setDraggedStation] = useState(null);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartStation, setDragStartStation] = useState(0);
  const svgRef = useRef(null);

  // Calculate dimensions with zoom applied to height only
  const svgWidth = 800;
  const voraufmassHeight = showVoraufmass ? 200 * zoomLevel : 0;
  const layerHeight = showSchichten ? layers.reduce((sum, layer) => sum + Math.max(layer.dicke * 2 * zoomLevel, 25 * zoomLevel), 0) : 0;
  const poiHeight = showPOI && pointsOfInterest.length > 0 ? 80 * zoomLevel : 0; // Height for POI diagram
  const spacingBetween = 10 * zoomLevel; // 10px spacing between sections
  const totalSpacing = (showVoraufmass && (showSchichten || showPOI)) ? spacingBetween : 0;
  const totalSpacing2 = (showSchichten && showPOI) ? spacingBetween : 0;
  const svgHeight = voraufmassHeight + layerHeight + poiHeight + totalSpacing + totalSpacing2 + (50 * zoomLevel); // Total height
  const margin = 50;
  const voraufmassCenterY = showVoraufmass ? 100 * zoomLevel : 0; // Center for initial measurement
  const layerStartY = showVoraufmass ? voraufmassHeight + spacingBetween : 25 * zoomLevel; // Start position for layers
  const poiStartY = showVoraufmass || showSchichten ? 
    (showVoraufmass ? voraufmassHeight : 0) + (showSchichten ? layerHeight : 0) + (showVoraufmass && showSchichten ? spacingBetween * 2 : spacingBetween) : 
    25 * zoomLevel; // Start position for POI diagram
  
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
            
            {/* POI Diagram - separate section */}
            {showPOI && pointsOfInterest.length > 0 && (
              <>
                {/* POI section background */}
                <rect
                  x={margin}
                  y={poiStartY}
                  width={svgWidth - 2 * margin}
                  height={poiHeight}
                  fill="#fef3c7"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  opacity="0.3"
                  rx="5"
                />
                
                {/* POI section title */}
                <text
                  x={margin + 10}
                  y={poiStartY + (20 * zoomLevel)}
                  className="fill-amber-700 font-bold"
                  fontSize={Math.max(12 * zoomLevel, 8)}
                >
                  Points of Interest
                </text>

                {/* Station reference line */}
                <line
                  x1={margin}
                  y1={poiStartY + (40 * zoomLevel)}
                  x2={svgWidth - margin}
                  y2={poiStartY + (40 * zoomLevel)}
                  stroke="#d1d5db"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />

                {/* POI markers in diagram */}
                {pointsOfInterest.map((poi) => {
                  const x = scaleX(poi.station);
                  const poiY = poiStartY + (40 * zoomLevel);
                  
                  return (
                    <g key={poi.id}>
                      {/* POI marker */}
                      <circle
                        cx={x}
                        cy={poiY}
                        r={12 * zoomLevel}
                        fill="#f59e0b"
                        stroke="white"
                        strokeWidth="2"
                        className="drop-shadow"
                      />
                      {/* POI symbol */}
                      <text
                        x={x}
                        y={poiY + (4 * zoomLevel)}
                        textAnchor="middle"
                        className="pointer-events-none"
                        fontSize={Math.max(14 * zoomLevel, 10)}
                      >
                        {poiTypes[poi.type] || '📍'}
                      </text>
                      {/* POI name */}
                      <text
                        x={x}
                        y={poiY - (18 * zoomLevel)}
                        textAnchor="middle"
                        className="fill-amber-700 font-bold"
                        fontSize={Math.max(10 * zoomLevel, 8)}
                      >
                        {poi.name}
                      </text>
                      {/* Station value */}
                      <text
                        x={x}
                        y={poiY + (25 * zoomLevel)}
                        textAnchor="middle"
                        className="fill-amber-600 text-xs"
                        fontSize={Math.max(8 * zoomLevel, 6)}
                      >
                        {poi.station.toFixed(1)}m
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* Points of Interest - shown above initial measurement (legacy) */}
            {false && pointsOfInterest.map((poi) => {
              const x = scaleX(poi.station);
              const poiY = showVoraufmass ? voraufmassCenterY - (120 * zoomLevel) : 50 * zoomLevel; // Above the initial measurement
              
              return (
                <g key={poi.id}>
                  {/* POI marker */}
                  <circle
                    cx={x}
                    cy={poiY}
                    r={8 * zoomLevel}
                    fill="#ff6b35"
                    stroke="white"
                    strokeWidth="2"
                    className="drop-shadow"
                  />
                  {/* POI icon */}
                  <text
                    x={x}
                    y={poiY + (3 * zoomLevel)}
                    textAnchor="middle"
                    className="fill-white font-bold pointer-events-none"
                    fontSize={Math.max(10 * zoomLevel, 8)}
                  >
                    {poiTypes[poi.type] || '📍'}
                  </text>
                  {/* POI label */}
                  <text
                    x={x}
                    y={poiY - (15 * zoomLevel)}
                    textAnchor="middle"
                    className="fill-orange-600 font-bold text-xs"
                    fontSize={Math.max(10 * zoomLevel, 8)}
                  >
                    {poi.name}
                  </text>
                  {/* Station line from POI to measurement */}
                  <line
                    x1={x}
                    y1={poiY + (8 * zoomLevel)}
                    x2={x}
                    y2={showVoraufmass ? voraufmassCenterY - (60 * zoomLevel) : layerStartY}
                    stroke="#ff6b35"
                    strokeWidth="1"
                    strokeDasharray="3,3"
                    opacity="0.7"
                  />
                </g>
              );
            })}

            {/* Center line */}
            {showVoraufmass && (
              <line
                x1={margin}
                y1={voraufmassCenterY}
                x2={svgWidth - margin}
                y2={voraufmassCenterY}
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}

            {/* Layer visualization - rectangular blocks with uniform height */}
            {showSchichten && layers.map((layer, layerIndex) => {
              // Calculate cumulative thickness from bottom up
              const layersBelow = layers.slice(0, layerIndex);
              const cumulativeThickness = layersBelow.reduce((sum, l) => sum + Math.max(l.dicke * 2 * zoomLevel, 25 * zoomLevel), 0); // Apply zoom
              const thisLayerStartY = layerStartY + cumulativeThickness;
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
                    y={thisLayerStartY}
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
                        y1={thisLayerStartY}
                        x2={x}
                        y2={thisLayerStartY + layerThickness}
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
                          y={thisLayerStartY}
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
                          cy={thisLayerStartY + layerThickness / 2}
                          r={Math.max(6 * zoomLevel, 4)} // Scale checkbox with zoom
                          fill={isActive ? layerColor : '#94a3b8'}
                          className="cursor-pointer"
                          onClick={() => onSectionToggle && onSectionToggle(layer.id, sectionKey)}
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={thisLayerStartY + layerThickness / 2 + (3 * zoomLevel)}
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
                    y1={thisLayerStartY}
                    x2={rightmostX}
                    y2={thisLayerStartY}
                    stroke={layerColor}
                    strokeWidth="2"
                  />
                  <line
                    x1={leftmostX}
                    y1={thisLayerStartY + layerThickness}
                    x2={rightmostX}
                    y2={thisLayerStartY + layerThickness}
                    stroke={layerColor}
                    strokeWidth="2"
                  />
                </g>
              );
            })}
            
            {/* Profile lines connecting station tops and bottoms - only if Voraufmass is shown */}
            {showVoraufmass && stations.length > 1 && (
              <>
                {/* Top profile line */}
                <path
                  d={stations.map((station, index) => {
                    const x = scaleX(station.station);
                    const halfWidth = (station.width * 20 * zoomLevel); // Apply zoom to width visualization
                    return `${index === 0 ? 'M' : 'L'} ${x} ${voraufmassCenterY - halfWidth}`;
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
                    return `${index === 0 ? 'M' : 'L'} ${x} ${voraufmassCenterY + halfWidth}`;
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
                    return `${index === 0 ? 'M' : 'L'} ${x} ${voraufmassCenterY - halfWidth}`;
                  }).join(' ')} ${stations.slice().reverse().map((station) => {
                    const x = scaleX(station.station);
                    const halfWidth = (station.width * 20 * zoomLevel); // Apply zoom to width visualization
                    return `L ${x} ${voraufmassCenterY + halfWidth}`;
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
                      cy={voraufmassCenterY - halfWidth}
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
                      cy={voraufmassCenterY + halfWidth}
                      r={4 * zoomLevel}
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}
              </>
            )}

            {/* Station markers and widths - only if Voraufmass is shown */}
            {showVoraufmass && stations.map((station) => {
              const x = scaleX(station.station);
              const halfWidth = (station.width * 20 * zoomLevel); // Apply zoom to width visualization
              const isHovered = hoveredStation === station.id;
              const isDragged = draggedStation?.id === station.id;
              
              return (
                <g key={station.id}>
                  {/* Width representation (vertical bar) */}
                  <rect
                    x={x - 3}
                    y={voraufmassCenterY - halfWidth}
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
                    cy={voraufmassCenterY}
                    r={4 * zoomLevel}
                    fill="#1e293b"
                    stroke="white"
                    strokeWidth="2"
                  />
                  
                  {/* Station label */}
                  <text
                    x={x}
                    y={voraufmassCenterY + halfWidth + (20 * zoomLevel)}
                    textAnchor="middle"
                    className="fill-slate-600 font-medium"
                    fontSize={Math.max(12 * zoomLevel, 8)}
                  >
                    {station.station.toFixed(1)}m
                  </text>
                  
                  {/* Width label */}
                  <text
                    x={x}
                    y={voraufmassCenterY - halfWidth - (10 * zoomLevel)}
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
                        cy={voraufmassCenterY - halfWidth - (15 * zoomLevel)}
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
                          y1={voraufmassCenterY - halfWidth - (19 * zoomLevel)}
                          x2={x + (19 * zoomLevel)}
                          y2={voraufmassCenterY - halfWidth - (11 * zoomLevel)}
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <line
                          x1={x + (19 * zoomLevel)}
                          y1={voraufmassCenterY - halfWidth - (19 * zoomLevel)}
                          x2={x + (11 * zoomLevel)}
                          y2={voraufmassCenterY - halfWidth - (11 * zoomLevel)}
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </g>
                      
                      {/* Edit indicator - dual direction arrows */}
                      <circle
                        cx={x - (15 * zoomLevel)}
                        cy={voraufmassCenterY - halfWidth - (15 * zoomLevel)}
                        r={12 * zoomLevel}
                        fill="#3b82f6"
                        className="cursor-move action-button"
                      />
                      {/* Arrow details simplified for space */}
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