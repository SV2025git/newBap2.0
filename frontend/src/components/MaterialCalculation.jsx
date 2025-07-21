import React from 'react';

const MaterialCalculation = ({ stations, layers, sectionActivation }) => {
  // Calculate area between two stations (trapezoidal area)
  const calculateSectionArea = (station1, station2) => {
    const distance = Math.abs(station2.station - station1.station);
    const avgWidth = (station1.width + station2.width) / 2;
    return distance * avgWidth;
  };

  // Calculate total material for each layer
  const calculateLayerMaterials = () => {
    return layers.map(layer => {
      let totalArea = 0;
      let activeSections = 0;

      // Sum up areas from active sections
      for (let i = 0; i < stations.length - 1; i++) {
        const sectionKey = `${stations[i].id}-${stations[i + 1].id}`;
        const isActive = sectionActivation[layer.id]?.[sectionKey];
        
        if (isActive) {
          const sectionArea = calculateSectionArea(stations[i], stations[i + 1]);
          totalArea += sectionArea;
          activeSections++;
        }
      }

      const totalMaterial = totalArea * layer.einbaugewicht;
      
      return {
        ...layer,
        totalArea,
        totalMaterial,
        activeSections,
        totalSections: stations.length - 1
      };
    });
  };

  const layerMaterials = calculateLayerMaterials();
  const totalProjectMaterial = layerMaterials.reduce((sum, layer) => sum + layer.totalMaterial, 0);

  if (layers.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        Keine Schichten für Berechnung vorhanden
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {layerMaterials.map((layer, index) => (
          <div key={layer.id} className="p-3 bg-slate-50 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">{layer.name}</h4>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {layer.activeSections}/{layer.totalSections} Aktiv
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span className="font-medium">Fläche:</span>
                <div className="font-mono">{layer.totalArea.toFixed(2)} m²</div>
              </div>
              <div>
                <span className="font-medium">Einbaugewicht:</span>
                <div className="font-mono">{layer.einbaugewicht} kg/m²</div>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Material gesamt:</span>
                <span className="font-mono font-bold text-green-700">
                  {(layer.totalMaterial / 1000).toFixed(2)} t
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {layerMaterials.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-bold text-lg text-slate-800">Gesamttonnage</h4>
              <p className="text-sm text-muted-foreground">
                {layers.length} Schichten, {stations.length} Stationen
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-700">
                {(totalProjectMaterial / 1000).toFixed(2)} t
              </div>
              <div className="text-sm text-muted-foreground">
                ({totalProjectMaterial.toFixed(0)} kg)
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground bg-slate-50 p-3 rounded">
        <strong>Hinweis:</strong> Tonnage-Berechnung erfolgt durch Multiplikation der 
        Trapezflächen zwischen den Stationen mit dem jeweiligen Einbaugewicht. 
        Nur aktive Abschnitte (✓) werden in die Berechnung einbezogen.
      </div>
    </div>
  );
};

export default MaterialCalculation;