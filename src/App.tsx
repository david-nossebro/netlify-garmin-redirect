import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet'
import './App.css';
import 'leaflet/dist/leaflet.css'
import ReactLeafletKml from 'react-leaflet-kml';

function App() {

  const [kml, setKml] = useState<Document | null>(null)

  useEffect(() => {
    const fetchGarminData = async () => {
      const result = await fetch('/garmin/davidsgronaband?d1=2021-01-01T00:00z')
      const resultText = await result.text()
      const parser = new DOMParser();
      const kml = parser.parseFromString(resultText, 'text/xml');
      setKml(kml)
    }
    fetchGarminData()
  }, [])


  return (
    <div className="App">
      <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        { kml != null &&
          <ReactLeafletKml kml={kml} />
        }
      </MapContainer>
    </div>
  );
}

export default App;
