"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Circle, Polygon, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type Coords = { lat: number; lng: number };
export type ServiceMode = "radius" | "polygon";

function ClickHandler({
  mode,
  onPickCenter,
  onAddPolygonPoint,
}: {
  mode: ServiceMode;
  onPickCenter: (coords: Coords) => void;
  onAddPolygonPoint: (coords: Coords) => void;
}) {
  useMapEvents({
    click(e) {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };
      if (mode === "polygon") onAddPolygonPoint(coords);
      else onPickCenter(coords);
    },
  });
  return null;
}

/** Pans the map whenever `value` changes from outside a user click/drag (e.g. the "use my location" button). */
function FlyToValue({ lat, lng }: Coords) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

export default function LocationPickerInner({
  value,
  onChange,
  defaultCenter,
  defaultZoom,
  height,
  mode,
  radiusKm,
  polygon,
  onAddPolygonPoint,
}: {
  value: Coords | null;
  onChange: (coords: Coords) => void;
  defaultCenter: Coords;
  defaultZoom: number;
  height: number;
  mode: ServiceMode;
  radiusKm: number | null;
  polygon: Coords[];
  onAddPolygonPoint: (coords: Coords) => void;
}) {
  const center = value ?? defaultCenter;

  return (
    <div className="overflow-hidden rounded-lg border" style={{ height }}>
      <MapContainer center={[center.lat, center.lng]} zoom={value ? 14 : defaultZoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler mode={mode} onPickCenter={onChange} onAddPolygonPoint={onAddPolygonPoint} />
        {value && (
          <>
            <Marker
              position={[value.lat, value.lng]}
              icon={markerIcon}
              draggable={mode === "radius"}
              eventHandlers={{
                dragend: (e) => {
                  const pos = e.target.getLatLng();
                  onChange({ lat: pos.lat, lng: pos.lng });
                },
              }}
            />
            <FlyToValue lat={value.lat} lng={value.lng} />
          </>
        )}
        {mode === "radius" && value && radiusKm != null && radiusKm > 0 && (
          <Circle center={[value.lat, value.lng]} radius={radiusKm * 1000} pathOptions={{ color: "#1c54d6" }} />
        )}
        {mode === "polygon" && polygon.length >= 3 && (
          <Polygon positions={polygon.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#1c54d6" }} />
        )}
      </MapContainer>
    </div>
  );
}
