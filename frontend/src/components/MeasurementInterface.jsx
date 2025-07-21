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
  const { toast } = useToast();

  // Initialize section activation when stations or layers change
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
          newSectionActivation[layer.id][sectionKey] = false; // Default to inactive
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mess-Interface
            </h1>
            <p className="text-muted-foreground mt-2">Station und Breite Verwaltung mit Schichtberechnung</p>
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

        {/* Station Graphic with Layers */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Grafische Darstellung mit Schichten
              <div className="text-sm font-normal text-muted-foreground">
                Stationen: {stations.length} | Gesamt: {stations.reduce((sum, s) => sum + s.width, 0).toFixed(2)}m
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StationGraphic 
              stations={stations} 
              layers={layers}
              sectionActivation={sectionActivation}
              onStationUpdate={updateStation}
              onStationDelete={deleteStation}
              onSectionToggle={toggleSectionActivation}
            />
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Station Input Form */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Neue Station hinzufügen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="station">Station (m)</Label>
                  <Input
                    id="station"
                    type="number"
                    step="0.1"
                    value={newStation.station}
                    onChange={(e) => setNewStation(prev => ({ ...prev, station: e.target.value }))}
                    placeholder="0.0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="width">Breite (m)</Label>
                  <Input
                    id="width"
                    type="number"
                    step="0.1"
                    value={newStation.width}
                    onChange={(e) => setNewStation(prev => ({ ...prev, width: e.target.value }))}
                    placeholder="0.0"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button onClick={addStation} className="w-full flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Station hinzufügen
              </Button>
            </CardContent>
          </Card>

          {/* Layer Management */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Schichten verwalten
                <Button 
                  onClick={() => setShowLayerManager(true)}
                  variant="outline"
                  size="sm"
                >
                  Schichten bearbeiten
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {layers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Noch keine Schichten vorhanden
                </p>
              ) : (
                <div className="space-y-2">
                  {layers.map((layer, index) => (
                    <div key={layer.id} className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{layer.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Dicke: {layer.dicke}cm | 
                            Einbaugewicht: {layer.einbaugewicht} kg/m²
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Material Calculation */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Materialberechnung</CardTitle>
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

        {/* Stations List */}
        <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Stationsliste</CardTitle>
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
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

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