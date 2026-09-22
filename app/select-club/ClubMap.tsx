'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { theme } from '../components/theme'

const T = theme

// Custom pin — a div icon instead of Leaflet's default marker images, which
// routinely break in bundlers without extra asset config. This one matches
// the app's red-glow brand language instead of Leaflet's default blue teardrop.
function makePinIcon(highlighted: boolean) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width: ${highlighted ? '20px' : '14px'};
        height: ${highlighted ? '20px' : '14px'};
        border-radius: 50%;
        background: ${T.colors.red};
        border: 2px solid #fff;
        box-shadow: 0 0 0 4px rgba(224,10,9,0.25), 0 0 16px rgba(224,10,9,0.5);
        cursor: pointer;
      "></div>
    `,
    iconSize: [highlighted ? 20 : 14, highlighted ? 20 : 14],
    iconAnchor: [highlighted ? 10 : 7, highlighted ? 10 : 7],
  })
}

export default function ClubMap({
  clubs, onSelect, submitting,
}: {
  clubs: { id: string; name: string; latitude: number | null; longitude: number | null }[]
  onSelect: (clubId: string) => void
  submitting: string | null
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const validClubs = clubs.filter(c => c.latitude != null && c.longitude != null)

  if (!mounted) return null

  return (
    <div style={{
      borderRadius: T.radius.lg, overflow: 'hidden',
      border: `1px solid ${T.colors.border}`, boxShadow: T.shadow.card,
    }}>
      <MapContainer
        center={[-29.0, 24.5]}
        zoom={5.5}
        style={{ height: '480px', width: '100%', background: T.colors.bg }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {validClubs.map(club => (
          <Marker
            key={club.id}
            position={[club.latitude as number, club.longitude as number]}
            icon={makePinIcon(submitting === club.id)}
            eventHandlers={{ click: () => onSelect(club.id) }}
          >
            <Popup>
              <div style={{ fontFamily: 'inherit', fontSize: '13px', fontWeight: 600 }}>
                {club.name}
                <button
                  onClick={() => onSelect(club.id)}
                  style={{
                    display: 'block', marginTop: '6px', padding: '5px 10px',
                    background: T.colors.red, color: '#fff', border: 'none',
                    borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {submitting === club.id ? 'Loading…' : `Go to ${club.name}`}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}