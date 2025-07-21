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
    dichte: 2300,
    dicke: 0.04,
    einbaugewicht: 92.0
  },
  {
    id: 2,
    name: "Asphalttragschicht", 
    rezept: "AC 22 T S",
    dichte: 2400,
    dicke: 0.08,
    einbaugewicht: 192.0
  },
  {
    id: 3,
    name: "Schottertragschicht", 
    rezept: "STS 0/32",
    dichte: 2200,
    dicke: 0.20,
    einbaugewicht: 440.0
  }
];