import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, Trash2, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const LayerManager = ({ layers, onLayersChange, onClose }) => {
  const [newLayer, setNewLayer] = useState({
    name: '',
    rezept: '',
    dichte: '',
    dicke: ''
  });
  const { toast } = useToast();

  const calculateEinbaugewicht = (dichte, dicke) => {
    // dichte in g/cm³, dicke in cm
    // Convert to kg/m²: (g/cm³ * cm * 10) = kg/m²
    return (parseFloat(dichte) || 0) * (parseFloat(dicke) || 0) * 10;
  };

  const addLayer = () => {
    if (!newLayer.name || !newLayer.rezept || !newLayer.dichte || !newLayer.dicke) {
      toast({
        title: "Fehler",
        description: "Bitte alle Felder ausfüllen",
        variant: "destructive"
      });
      return;
    }

    const layer = {
      id: Date.now(),
      name: newLayer.name,
      rezept: newLayer.rezept,
      dichte: parseFloat(newLayer.dichte),
      dicke: parseFloat(newLayer.dicke),
      einbaugewicht: calculateEinbaugewicht(newLayer.dichte, newLayer.dicke)
    };

    onLayersChange(prev => [...prev, layer]);
    setNewLayer({ name: '', rezept: '', dichte: '', dicke: '' });
    toast({
      title: "Schicht hinzugefügt",
      description: `${layer.name} wurde erfolgreich hinzugefügt`
    });
  };

  const deleteLayer = (id) => {
    onLayersChange(prev => prev.filter(l => l.id !== id));
    toast({
      title: "Schicht gelöscht",
      description: "Schicht wurde erfolgreich entfernt"
    });
  };

  const updateLayer = (id, field, value) => {
    onLayersChange(prev => prev.map(layer => {
      if (layer.id === id) {
        const updatedLayer = { ...layer, [field]: field === 'name' || field === 'rezept' ? value : parseFloat(value) };
        if (field === 'dichte' || field === 'dicke') {
          updatedLayer.einbaugewicht = calculateEinbaugewicht(
            field === 'dichte' ? value : updatedLayer.dichte,
            field === 'dicke' ? value : updatedLayer.dicke
          );
        }
        return updatedLayer;
      }
      return layer;
    }));
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Schichten verwalten
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new layer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Neue Schicht hinzufügen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newLayer.name}
                    onChange={(e) => setNewLayer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="z.B. Asphaltschicht"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="rezept">Rezept</Label>
                  <Input
                    id="rezept"
                    value={newLayer.rezept}
                    onChange={(e) => setNewLayer(prev => ({ ...prev, rezept: e.target.value }))}
                    placeholder="z.B. AC 11 D S"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dichte">Dichte (g/cm³)</Label>
                  <Input
                    id="dichte"
                    type="number"
                    step="0.1"
                    value={newLayer.dichte}
                    onChange={(e) => setNewLayer(prev => ({ ...prev, dichte: e.target.value }))}
                    placeholder="2.3"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dicke">Dicke (cm)</Label>
                  <Input
                    id="dicke"
                    type="number"
                    step="1"
                    value={newLayer.dicke}
                    onChange={(e) => setNewLayer(prev => ({ ...prev, dicke: e.target.value }))}
                    placeholder="4"
                    className="mt-1"
                  />
                </div>
              </div>
              
              {newLayer.dichte && newLayer.dicke && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800">
                    Berechnetes Einbaugewicht: {calculateEinbaugewicht(newLayer.dichte, newLayer.dicke).toFixed(2)} kg/m²
                  </p>
                </div>
              )}
              
              <Button onClick={addLayer} className="w-full flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Schicht hinzufügen
              </Button>
            </CardContent>
          </Card>

          {/* Existing layers */}
          {layers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vorhandene Schichten ({layers.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {layers.map((layer, index) => (
                    <div key={layer.id} className="p-4 border rounded-lg bg-slate-50">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <h4 className="font-medium text-lg">{layer.name}</h4>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLayer(layer.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Rezept</Label>
                          <Input
                            value={layer.rezept}
                            onChange={(e) => updateLayer(layer.id, 'rezept', e.target.value)}
                            className="mt-1 h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Dichte (g/cm³)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={layer.dichte}
                            onChange={(e) => updateLayer(layer.id, 'dichte', e.target.value)}
                            className="mt-1 h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Dicke (cm)</Label>
                          <Input
                            type="number"
                            step="1"
                            value={layer.dicke}
                            onChange={(e) => updateLayer(layer.id, 'dicke', e.target.value)}
                            className="mt-1 h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Einbaugewicht (kg/m²)</Label>
                          <div className="mt-1 h-8 px-3 py-1 bg-gray-100 rounded border text-sm flex items-center font-medium text-green-700">
                            {layer.einbaugewicht.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LayerManager;