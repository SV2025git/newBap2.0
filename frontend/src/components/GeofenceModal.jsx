import React, { useState, useRef } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';

const GeofenceModal = ({ isOpen, onClose, pointsOfInterest, onAddGeofence, poiTypes }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [geofenceName, setGeofenceName] = useState('');
  const svgRef = useRef(null);

  const handleMouseDown = (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const handleMouseMove = (event) => {
    if (!isDrawing) return;
    
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 2) {
      // Close the polygon by connecting back to start
      const closedPath = [...currentPath, currentPath[0]];
      setGeofences(prev => [...prev, {
        id: Date.now(),
        name: geofenceName || `Geofence ${prev.length + 1}`,
        path: closedPath
      }]);
      setGeofenceName('');
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const handleOK = () => {
    if (geofences.length > 0) {
      onAddGeofence(geofences);
      setGeofences([]);
    }
    onClose();
  };

  const handleCancel = () => {
    setGeofences([]);
    setCurrentPath([]);
    setIsDrawing(false);
    setGeofenceName('');
    onClose();
  };

  const clearGeofences = () => {
    setGeofences([]);
    setCurrentPath([]);
    setIsDrawing(false);
  };

  const pathToString = (path) => {
    if (path.length === 0) return '';
    return `M ${path[0].x} ${path[0].y} ` + 
           path.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ') + 
           ' Z';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-full w-full p-0 bg-slate-900">
        <div className="relative w-full h-full">
          {/* Map Area with Drawing */}
          <div className="w-full h-full bg-gradient-to-br from-green-200 via-green-100 to-blue-100 relative">
            {/* Mock Map Background */}
            <div className="absolute inset-0 opacity-70">
              <svg width="100%" height="100%" className="absolute inset-0">
                {/* Mock road/path */}
                <path
                  d="M 50 300 Q 200 200 400 350 T 800 400 Q 1000 450 1200 300"
                  stroke="#8B5CF6" 
                  strokeWidth="8"
                  fill="none"
                  opacity="0.6"
                />
                {/* Grid lines for reference */}
                <defs>
                  <pattern id="geofenceGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#geofenceGrid)" />
              </svg>
            </div>

            {/* Drawing Canvas */}
            <svg
              ref={svgRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Existing Geofences */}
              {geofences.map((geofence) => (
                <g key={geofence.id}>
                  <path
                    d={pathToString(geofence.path)}
                    fill="rgba(255, 0, 0, 0.2)"
                    stroke="red"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                  {/* Geofence label */}
                  {geofence.path.length > 0 && (
                    <text
                      x={geofence.path[0].x}
                      y={geofence.path[0].y - 10}
                      fill="red"
                      fontSize="12"
                      fontWeight="bold"
                    >
                      {geofence.name}
                    </text>
                  )}
                </g>
              ))}

              {/* Current Drawing Path */}
              {currentPath.length > 1 && (
                <path
                  d={pathToString(currentPath)}
                  fill="rgba(255, 255, 0, 0.3)"
                  stroke="orange"
                  strokeWidth="3"
                  strokeDasharray="3,3"
                />
              )}

              {/* Current Drawing Points */}
              {currentPath.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="orange"
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
            </svg>

            {/* Existing POIs */}
            {pointsOfInterest.map((poi) => (
              <div
                key={poi.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg border-2 border-blue-500 z-10"
                style={{
                  left: `${(poi.station / 60) * 100}%`,
                  top: `${Math.random() * 60 + 20}%` // Random Y position for demo
                }}
              >
                <div className="text-2xl">{poiTypes[poi.type] || '📍'}</div>
                <div className="text-xs font-bold text-center mt-1 bg-white px-1 rounded">
                  {poi.name}
                </div>
              </div>
            ))}

            {/* Map Title */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow z-10">
              <h2 className="text-xl font-bold text-slate-800">Geofence Karte</h2>
              <p className="text-sm text-muted-foreground mb-2">
                Zeichnen Sie einen Bereich durch Klicken und Ziehen
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  value={geofenceName}
                  onChange={(e) => setGeofenceName(e.target.value)}
                  placeholder="Geofence Name (optional)"
                  className="w-full px-2 py-1 border rounded text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={clearGeofences}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    disabled={geofences.length === 0}
                  >
                    Löschen
                  </button>
                  <div className="text-xs text-muted-foreground flex items-center">
                    Geofences: {geofences.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Drawing Instructions */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow z-10 max-w-xs">
              <h3 className="font-bold text-sm mb-2">Anleitung</h3>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Klicken und ziehen Sie, um einen Bereich zu zeichnen</li>
                <li>• Lassen Sie die Maustaste los, um die Form zu schließen</li>
                <li>• POIs werden auf der Karte angezeigt</li>
                <li>• Geofences erscheinen als rote gestrichelte Bereiche</li>
              </ul>
            </div>
          </div>

          {/* Control Panel */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border flex gap-4 z-20">
            <Button
              onClick={handleOK}
              className="px-6"
            >
              OK
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-6"
            >
              Abbrechen
            </Button>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="text-blue-600">📍</span>
                POIs: {pointsOfInterest.length}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-600">🔴</span>
                Geofences: {geofences.length}
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold z-30"
          >
            ×
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GeofenceModal;