// Mock data for initial development - will be replaced with backend integration

export const mockStations = [
  { id: 1, station: 0.0, width: 2.5 },
  { id: 2, station: 10.5, width: 3.2 },
  { id: 3, station: 25.0, width: 2.8 },
  { id: 4, station: 40.3, width: 4.1 },
  { id: 5, station: 55.7, width: 3.5 }
];

export const mockLayers = [
  {
    id: 1,
    name: "Asphaltdeckschicht",
    rezept: "AC 11 D S",
    dichte: 2.3, // g/cm³
    dicke: 4, // cm
    einbaugewicht: 92.0 // kg/m²
  },
  {
    id: 2,
    name: "Asphalttragschicht", 
    rezept: "AC 22 T S",
    dichte: 2.4, // g/cm³
    dicke: 8, // cm
    einbaugewicht: 192.0 // kg/m²
  },
  {
    id: 3,
    name: "Schottertragschicht", 
    rezept: "STS 0/32",
    dichte: 2.2, // g/cm³
    dicke: 20, // cm
    einbaugewicht: 440.0 // kg/m²
  }
];