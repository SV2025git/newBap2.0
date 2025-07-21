import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Trash2, Edit3, Save, Plus } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import StationGraphic from './StationGraphic';
import LayerManager from './LayerManager';
import MaterialCalculation from './MaterialCalculation';
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
  const [isGraphicsFixed, setIsGraphicsFixed] = useState(false); // Fixed position toggle
  const { toast } = useToast();

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
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm" style={{ maxHeight: '25vh' }}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Grafische Darstellung mit Schichten
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
                <div className="text-sm font-normal text-muted-foreground">
                  Stationen: {stations.length} | Gesamt: {stations.reduce((sum, s) => sum + s.width, 0).toFixed(2)}m
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent style={{ maxHeight: 'calc(25vh - 80px)', overflowY: 'auto' }}>
            <StationGraphic 
              stations={stations} 
              layers={layers}
              sectionActivation={sectionActivation}
              zoomLevel={zoomLevel}
              showVoraufmass={showVoraufmass}
              showSchichten={showSchichten}
              onStationUpdate={updateStation}
              onStationDelete={deleteStation}
              onSectionToggle={toggleSectionActivation}
            />
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
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

          {/* Tonnage - 33% width */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm lg:col-span-1">
            <CardHeader>
              <CardTitle>Tonnage</CardTitle>
            </CardHeader>
            <CardContent>
              <MaterialCalculation
                stations={stations}
                layers={layers}
                sectionActivation={sectionActivation}
              />
            </CardContent>
          </Card>
        </div>

        {showLayerManager && (
          <LayerManager
            layers={layers}
            onLayersChange={setLayers}
            onClose={() => setShowLayerManager(false)}
          />
        )}
      </div>
    </div>
  );
};

export default MeasurementInterface;