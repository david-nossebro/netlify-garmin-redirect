import React, { useEffect, useState } from 'react';
import './App.css';
import 'leaflet/dist/leaflet.css'
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png';

import tentIcon from './tent.svg';
import messageIcon from './message.svg'
import hikerIcon from './hiking.svg'

let TentIcon = L.icon({
  iconUrl: tentIcon,
  iconSize: [40, 40],
  popupAnchor: [0, -15]
})

let HikerIcon = L.icon({
  iconUrl: hikerIcon,
  iconSize: [40, 40],
  popupAnchor: [10, -30],
  iconAnchor: [10, 30]
})

let MessageIcon = L.icon({
  iconUrl: messageIcon,
  iconSize: [40, 40],
  iconAnchor: [7, 35],
  popupAnchor: [0, -15]
})

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerIconShadow,
    iconAnchor: [13, 40],
    popupAnchor: [0, -35],
    iconSize: [40, 40]
});

L.Marker.prototype.options.icon = DefaultIcon;

const tj = require('@mapbox/togeojson')

function App() {

  const [map, setMap] = useState<L.Map | null>(null)
  const [geoJson, setGeoJson] = useState()
  const [currentZoomLevel, setCurrentZoomLevel] = useState(5)

  useEffect(() => {
    let mymap: L.Map = L.map('mapid').setView([58.286395, 10.107422], 5)
    //L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mymap);
    L.tileLayer('https://b.tile.opentopomap.org/{z}/{x}/{y}.png').addTo(mymap);
    mymap.on('zoomend', () => {
      console.log("ZoomLevel: ", mymap.getZoom())
      setCurrentZoomLevel(mymap.getZoom())
    })
    setMap(mymap)
  }, [])

  useEffect(() => {
    const fetchGarminData = async () => {
      const result = await fetch('/garmin/davidsgronaband?d1=2021-01-01T00:00z')
      const resultText = await result.text()
      const parser = new DOMParser()
      const kml = parser.parseFromString(resultText, 'text/xml')
      let geoJson = tj.kml(kml, { styles: false })

      if(!geoJson.features || geoJson.features.length === 0) {
        return
      }

      // Getting the newestFeature (also to be seen as the last known location)
      geoJson.features.sort((f1: any, f2: any) => {
        if(f1.geometry.type === "LineString") {
          return 1
        }
        if(f2.geometry.type === "LineString") {
          return -1
        }

        if(f1.properties.timestamp > f2.properties.timestamp) {
          return -1
        } else {
          return 1
        }
      })
      let newestFeature = geoJson.features[0]
      geoJson.features[0].properties.newestFeature = true
      console.log("newestFeature: ", JSON.stringify(newestFeature))

      // Remove all points that are just tracking points (we still show a linestring)
      geoJson = geoJson.features.filter((f: any) => {
        if(f.geometry.type === "Point" && !f.properties.Text && f !== newestFeature) {
          return false
        } else {
          return true
        }
      })
      console.log("geoJson: ", JSON.stringify(geoJson))
      setGeoJson(geoJson)
    }
    fetchGarminData()
  }, [])

  useEffect(() => {
    if(map != null && geoJson != null) {
      let feature = L
        .geoJSON(geoJson, {

          pointToLayer: function (feature, latlng) {
            // Here we set some custom icons and popup texts.

            let marker = L.marker(latlng)
            let message = null

            let date = new Date(feature.properties.timestamp)
            if(feature.properties.Text) {
              message = feature.properties.Text
              
              if(message.includes('sov') || message.includes('tält')) {
                marker.setIcon(TentIcon)
              } else {
                marker.setIcon(MessageIcon)
              }
            } 
            
            if(feature.properties.newestFeature) {
              message = "Sist jag skicka en uppdatering va jag här."
              marker.setIcon(HikerIcon)
            }

            if(message) {
              message += "<br /><br />" + date.toLocaleString()
              marker.bindPopup(message)
            }

            return marker
          }
        })
        .addTo(map);
      map.fitBounds(feature.getBounds());
    }
  }, [geoJson, map])

  return (
    <div className="App">
      <div id="mapid" />
    </div>
  );
}

export default App;
