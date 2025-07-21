import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Trash2, Edit3, Save, Plus } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import StationGraphic from './StationGraphic';
import LayerManager from './LayerManager';
import MapModal from './MapModal';
import { mockStations, mockLayers } from '../utils/mockData';

const MeasurementInterface = () => {
  const [stations, setStations] = useState(mockStations);
  const [newStation, setNewStation] = useState({ station: '', width: '' });
  const [editingId, setEditingId] = useState(null);
  const [projectName, setProjectName] = useState('Neues Messprojekt');
  const [layers, setLayers] = useState(mockLayers);
  const [showLayerManager, setShowLayerManager] = useState(false);
  const [sectionActivation, setSectionActivation] = useState({}); // Track which sections are active for each layer
  const [zoomLevel, setZoomLevel] = useState(0.5); // Start at 50% height
  const [showVoraufmass, setShowVoraufmass] = useState(true); // Show initial measurement
  const [showSchichten, setShowSchichten] = useState(true); // Show layers
  const [showPOI, setShowPOI] = useState(true); // Show POIs
  const [isGraphicsFixed, setIsGraphicsFixed] = useState(false); // Fixed position toggle
  const [pointsOfInterest, setPointsOfInterest] = useState([]); // Points of interest
  const [newPOI, setNewPOI] = useState({ station: '', name: '', type: 'Beginn' }); // New point of interest
  const [showMapModal, setShowMapModal] = useState(false); // Map modal visibility
  const [editingPOI, setEditingPOI] = useState(null); // POI being edited
  const [geofences, setGeofences] = useState([]); // Geofences
  const { toast } = useToast();

  // POI types with symbols
  const poiTypes = {
    'Beginn': '🚀',
    'Ende': '🏁',
    'Einfahrt': '🚪',
    'Wendeplatz': '🔄',
    'Putzplatz': '🧹',
    'Hochspannung': '⚡',
    'Brücke': '🌉',
    'Custom': '📍'
  };

  const addPointOfInterest = () => {
    if (!newPOI.station) {
      toast({
        title: "Fehler",
        description: "Bitte Station eingeben",
        variant: "destructive"
      });
      return;
    }

    const poiName = newPOI.name || `${poiTypes[newPOI.type]} ${newPOI.type}`;

    const poi = {
      id: Date.now(),
      station: parseFloat(newPOI.station),
      name: poiName,
      type: newPOI.type || 'Beginn'
    };

    setPointsOfInterest(prev => [...prev, poi].sort((a, b) => a.station - b.station));
    setNewPOI({ station: '', name: '', type: 'Beginn' });
    toast({
      title: "Point of Interest hinzugefügt",
      description: `${poi.name} bei Station ${poi.station}m wurde hinzugefügt`
    });
  };

  const updatePointOfInterest = (id, field, value) => {
    setPointsOfInterest(prev => prev.map(p => 
      p.id === id ? { ...p, [field]: field === 'station' ? parseFloat(value) : value } : p
    ).sort((a, b) => a.station - b.station));
  };

  const deletePointOfInterest = (id) => {
    setPointsOfInterest(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Point of Interest gelöscht",
      description: "Point of Interest wurde erfolgreich entfernt"
    });
  };

  // Initialize section activation when stations or layers change - DEFAULT ALL ACTIVE
  useEffect(() => {
    const newSectionActivation = { ...sectionActivation };
    
    layers.forEach(layer => {
      if (!newSectionActivation[layer.id]) {
        newSectionActivation[layer.id] = {};
      }
      
      // Create sections between consecutive stations
      for (let i = 0; i < stations.length - 1; i++) {
        const sectionKey = `${stations[i].id}-${stations[i + 1].id}`;
        if (newSectionActivation[layer.id][sectionKey] === undefined) {
          newSectionActivation[layer.id][sectionKey] = true; // Default to ACTIVE
        }
      }
    });
    
    setSectionActivation(newSectionActivation);
  }, [stations, layers]);

  const toggleSectionActivation = (layerId, sectionKey) => {
    setSectionActivation(prev => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        [sectionKey]: !prev[layerId]?.[sectionKey]
      }
    }));
  };

  const addStation = () => {
    if (!newStation.station || !newStation.width) {
      toast({
        title: "Fehler",
        description: "Bitte Station und Breite eingeben",
        variant: "destructive"
      });
      return;
    }

    const station = {
      id: Date.now(),
      station: parseFloat(newStation.station),
      width: parseFloat(newStation.width)
    };

    setStations(prev => [...prev, station].sort((a, b) => a.station - b.station));
    setNewStation({ station: '', width: '' });
    toast({
      title: "Station hinzugefügt",
      description: `Station ${station.station}m mit Breite ${station.width}m wurde hinzugefügt`
    });
  };

  const deleteStation = (id) => {
    setStations(prev => prev.filter(s => s.id !== id));
    toast({
      title: "Station gelöscht",
      description: "Station wurde erfolgreich entfernt"
    });
  };

  const updateStation = (id, field, value) => {
    setStations(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: parseFloat(value) } : s
    ).sort((a, b) => a.station - b.station));
  };

  const saveProject = () => {
    const project = {
      name: projectName,
      stations,
      layers,
      sectionActivation,
      savedAt: new Date().toISOString()
    };
    
    // Mock save to localStorage
    localStorage.setItem('measurement-project', JSON.stringify(project));
    toast({
      title: "Projekt gespeichert",
      description: `${projectName} wurde erfolgreich gespeichert`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-blue-900">
              BPO ASPHALT
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-64"
              placeholder="Projektname"
            />
            <Button onClick={saveProject} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Projekt speichern
            </Button>
          </div>
        </div>

        {/* Station Graphic with Layers - Limited to 25% height */}
        <Card 
          className={`shadow-lg border-0 bg-white/70 backdrop-blur-sm transition-all duration-300 ${
            isGraphicsFixed ? 'fixed top-4 left-4 right-4 z-10' : ''
          }`} 
          style={{ maxHeight: '25vh' }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={showVoraufmass ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowVoraufmass(!showVoraufmass)}
                    className="px-3"
                  >
                    Voraufmaß
                  </Button>
                  <Button
                    variant={showSchichten ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowSchichten(!showSchichten)}
                    className="px-3"
                  >
                    Schichten
                  </Button>
                  <Button
                    variant={showPOI ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPOI(!showPOI)}
                    className="px-3"
                  >
                    POI
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(prev => Math.max(0.2, prev - 0.1))}
                    className="px-2"
                  >
                    <span className="text-lg font-bold">-</span>
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-16 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoomLevel(prev => Math.min(1.5, prev + 0.1))}
                    className="px-2"
                  >
                    <span className="text-lg font-bold">+</span>
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGraphicsFixed(!isGraphicsFixed)}
                  className="flex items-center gap-2"
                >
                  {isGraphicsFixed ? '📌' : '📍'}
                  {isGraphicsFixed ? 'Lösen' : 'Fixieren'}
                </Button>
                <div className="text-sm font-normal text-muted-foreground">
                  Stationen: {stations.length}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ maxHeight: 'calc(25vh - 60px)', overflowY: 'auto' }}>
            <StationGraphic 
              stations={stations} 
              layers={layers}
              sectionActivation={sectionActivation}
              zoomLevel={zoomLevel}
              showVoraufmass={showVoraufmass}
              showSchichten={showSchichten}
              showPOI={showPOI}
              pointsOfInterest={pointsOfInterest}
              poiTypes={poiTypes}
              onStationUpdate={updateStation}
              onStationDelete={deleteStation}
              onSectionToggle={toggleSectionActivation}
            />
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6" style={{ marginTop: isGraphicsFixed ? '28vh' : '0', marginBottom: '200px' }}>
          {/* Stations List - 66% width */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Stationsliste
                <Button 
                  onClick={() => setShowLayerManager(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  Material
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stations.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Keine Stationen vorhanden. Fügen Sie eine neue Station hinzu.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Station (m)</th>
                        <th className="text-left p-3">Breite (m)</th>
                        <th className="text-right p-3">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stations.map((station) => (
                        <tr key={station.id} className="border-b hover:bg-slate-50/50 transition-colors">
                          <td className="p-3">
                            {editingId === station.id ? (
                              <Input
                                type="number"
                                step="0.1"
                                value={station.station}
                                onChange={(e) => updateStation(station.id, 'station', e.target.value)}
                                onBlur={() => setEditingId(null)}
                                className="w-24"
                                autoFocus
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingId(station.id)}
                                className="cursor-pointer hover:text-blue-600 transition-colors"
                              >
                                {station.station.toFixed(1)}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {editingId === station.id ? (
                              <Input
                                type="number"
                                step="0.1"
                                value={station.width}
                                onChange={(e) => updateStation(station.id, 'width', e.target.value)}
                                onBlur={() => setEditingId(null)}
                                className="w-24"
                              />
                            ) : (
                              <span 
                                onClick={() => setEditingId(station.id)}
                                className="cursor-pointer hover:text-blue-600 transition-colors"
                              >
                                {station.width.toFixed(1)}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Add new station after current one
                                  const currentIndex = stations.findIndex(s => s.id === station.id);
                                  const newStationValue = station.station + 5; // 5m after current
                                  const newStation = {
                                    id: Date.now(),
                                    station: newStationValue,
                                    width: station.width // Same width as current
                                  };
                                  setStations(prev => [...prev, newStation].sort((a, b) => a.station - b.station));
                                  toast({
                                    title: "Station hinzugefügt",
                                    description: `Neue Station ${newStationValue.toFixed(1)}m wurde hinzugefügt`
                                  });
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingId(station.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteStation(station.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {/* Add new station row */}
                      <tr className="border-b bg-slate-50/30">
                        <td className="p-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={newStation.station}
                            onChange={(e) => setNewStation(prev => ({ ...prev, station: e.target.value }))}
                            placeholder="Station (m)"
                            className="w-full"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            step="0.1"
                            value={newStation.width}
                            onChange={(e) => setNewStation(prev => ({ ...prev, width: e.target.value }))}
                            placeholder="Breite (m)"
                            className="w-full"
                          />
                        </td>
                        <td className="p-3">
                          <Button
                            onClick={addStation}
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Hinzufügen
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points of Interest - 33% width */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Points of Interest
                <Button
                  onClick={() => setShowMapModal(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  🗺️ Karte
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Add new POI */}
                <div className="grid grid-cols-1 gap-2">
                  <Input
                    type="number"
                    step="0.1"
                    value={newPOI.station}
                    onChange={(e) => setNewPOI(prev => ({ ...prev, station: e.target.value }))}
                    placeholder="Station (m)"
                  />
                  <Input
                    value={newPOI.name}
                    onChange={(e) => setNewPOI(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="POI Name"
                  />
                  <select
                    value={newPOI.type}
                    onChange={(e) => setNewPOI(prev => ({ ...prev, type: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.keys(poiTypes).map(type => (
                      <option key={type} value={type}>
                        {poiTypes[type]} {type}
                      </option>
                    ))}
                  </select>
                  <Button onClick={addPointOfInterest} size="sm" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    POI hinzufügen
                  </Button>
                </div>

                {/* POI List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pointsOfInterest.map((poi) => (
                    <div key={poi.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {editingPOI === poi.id ? (
                            <div className="space-y-2">
                              <Input
                                value={poi.name}
                                onChange={(e) => updatePointOfInterest(poi.id, 'name', e.target.value)}
                                className="text-sm"
                              />
                              <Input
                                type="number"
                                step="0.1"
                                value={poi.station}
                                onChange={(e) => updatePointOfInterest(poi.id, 'station', e.target.value)}
                                className="text-sm"
                              />
                              <select
                                value={poi.type}
                                onChange={(e) => updatePointOfInterest(poi.id, 'type', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {Object.keys(poiTypes).map(type => (
                                  <option key={type} value={type}>
                                    {poiTypes[type]} {type}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => setEditingPOI(null)}
                                  className="text-xs"
                                >
                                  Speichern
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => setEditingPOI(null)}
                                  className="text-xs"
                                >
                                  Abbrechen
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div onClick={() => setEditingPOI(poi.id)} className="cursor-pointer">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{poiTypes[poi.type] || '📍'}</span>
                                <h4 className="font-medium text-sm">{poi.name}</h4>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {poi.type} - Station {poi.station.toFixed(1)}m
                              </p>
                            </div>
                          )}
                        </div>
                        {editingPOI !== poi.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePointOfInterest(poi.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Geofence Section */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-sm mb-2">Geofence</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Geofence",
                        description: "Geofence-Funktion wird entwickelt"
                      });
                    }}
                  >
                    + Geofence hinzufügen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fixed Bottom Tonnage Panel */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t shadow-lg p-4 z-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Tonnage-Übersicht</h3>
              <div className="flex items-center gap-8">
                {layers.map((layer, index) => {
                  // Calculate layer totals
                  let totalArea = 0;
                  for (let i = 0; i < stations.length - 1; i++) {
                    const sectionKey = `${stations[i].id}-${stations[i + 1].id}`;
                    const isActive = sectionActivation[layer.id]?.[sectionKey];
                    if (isActive) {
                      const distance = Math.abs(stations[i + 1].station - stations[i].station);
                      const avgWidth = (stations[i].width + stations[i + 1].width) / 2;
                      totalArea += distance * avgWidth;
                    }
                  }
                  const totalTonnage = (totalArea * layer.einbaugewicht) / 1000;
                  
                  return (
                    <div key={layer.id} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: ['#ef4444', '#f97316', '#eab308'][index % 3] }}
                      ></div>
                      <div className="text-sm">
                        <div className="font-medium leading-tight">{layer.name}</div>
                        <div className="text-muted-foreground leading-tight">
                          Fläche: {totalArea.toFixed(2)} m² | Tonnage: {totalTonnage.toFixed(2)} t
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="px-4 py-2 bg-green-100 rounded-lg">
                  <div className="font-bold text-green-800 leading-tight">
                    Gesamt: {layers.reduce((total, layer) => {
                      let layerArea = 0;
                      for (let i = 0; i < stations.length - 1; i++) {
                        const sectionKey = `${stations[i].id}-${stations[i + 1].id}`;
                        const isActive = sectionActivation[layer.id]?.[sectionKey];
                        if (isActive) {
                          const distance = Math.abs(stations[i + 1].station - stations[i].station);
                          const avgWidth = (stations[i].width + stations[i + 1].width) / 2;
                          layerArea += distance * avgWidth;
                        }
                      }
                      return total + (layerArea * layer.einbaugewicht) / 1000;
                    }, 0).toFixed(2)} t
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showLayerManager && (
          <LayerManager
            layers={layers}
            onLayersChange={setLayers}
            onClose={() => setShowLayerManager(false)}
          />
        )}

        {showMapModal && (
          <MapModal
            isOpen={showMapModal}
            onClose={() => setShowMapModal(false)}
            pointsOfInterest={pointsOfInterest}
            onAddPOI={(poi) => {
              const newPoi = {
                id: Date.now(),
                station: poi.station,
                name: poi.name,
                type: poi.type
              };
              setPointsOfInterest(prev => [...prev, newPoi].sort((a, b) => a.station - b.station));
              toast({
                title: "POI von Karte hinzugefügt",
                description: `${poi.name} bei Station ${poi.station.toFixed(1)}m wurde hinzugefügt`
              });
            }}
            poiTypes={poiTypes}
          />
        )}
      </div>
    </div>
  );
};

export default MeasurementInterface;