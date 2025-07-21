import React, { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';

const MapModal = ({ isOpen, onClose, pointsOfInterest, onAddPOI, poiTypes }) => {
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [newPOI, setNewPOI] = useState({ name: '', type: 'Beginn' });

  const handleMapClick = (event) => {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel position to station (simple linear mapping)
    const mapWidth = rect.width;
    const station = (x / mapWidth) * 60; // Assuming 0-60m range
    
    setSelectedPosition({ x, y, station });
  };

  const handleOK = () => {
    if (selectedPosition) {
      const poiName = newPOI.name || `${poiTypes[newPOI.type]} ${newPOI.type}`;
      onAddPOI({
        station: selectedPosition.station,
        name: poiName,
        type: newPOI.type
      });
      setSelectedPosition(null);
      setNewPOI({ name: '', type: 'Beginn' });
      onClose();
    }
  };

  const handleCancel = () => {
    setSelectedPosition(null);
    setNewPOI({ name: '', type: 'Beginn' });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full h-full w-full p-0 bg-slate-900">
        <div className="relative w-full h-full">
          {/* Map Area */}
          <div 
            className="w-full h-full bg-gradient-to-br from-green-200 via-green-100 to-blue-100 relative cursor-crosshair"
            onClick={handleMapClick}
          >
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
                  <pattern id="mapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#mapGrid)" />
              </svg>
            </div>

            {/* Existing POIs */}
            {pointsOfInterest.map((poi) => (
              <div
                key={poi.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg border-2 border-blue-500"
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

            {/* Selected Position */}
            {selectedPosition && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full p-3 shadow-lg animate-pulse"
                style={{
                  left: selectedPosition.x,
                  top: selectedPosition.y
                }}
              >
                <div className="text-white text-xl">📍</div>
              </div>
            )}

            {/* Map Title */}
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow">
              <h2 className="text-xl font-bold text-slate-800">POI Karte</h2>
              <p className="text-sm text-muted-foreground">
                Klicken Sie auf die Karte, um einen POI hinzuzufügen
              </p>
            </div>

            {/* POI Input Panel */}
            {selectedPosition && (
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
                <h3 className="font-bold mb-3">Neuer POI</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Station</label>
                    <input 
                      type="text" 
                      value={`${selectedPosition.station.toFixed(1)}m`} 
                      disabled 
                      className="w-full px-3 py-1 border rounded text-sm bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={newPOI.name}
                      onChange={(e) => setNewPOI(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="POI Name (optional)"
                      className="w-full px-3 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Typ</label>
                    <select
                      value={newPOI.type}
                      onChange={(e) => setNewPOI(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-1 border rounded text-sm"
                    >
                      {Object.keys(poiTypes).map(type => (
                        <option key={type} value={type}>
                          {poiTypes[type]} {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Control Panel */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border flex gap-4">
            <Button
              onClick={handleOK}
              disabled={!selectedPosition}
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-green-600">●</span>
              POIs: {pointsOfInterest.length}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold z-10"
          >
            ×
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapModal;