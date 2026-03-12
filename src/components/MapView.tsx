"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { useEffect as useLayoutEffect, useRef } from "react";
import { supabase, Graffiti } from "@/lib/supabase";

// Fix Leaflet default marker icon (known Next.js issue)
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

// Component to recenter the map when user location is found
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [map, lat, lng]);
  return null;
}

// Marker cluster component using leaflet.markercluster directly
function ClusteredMarkers({ graffiti }: { graffiti: Graffiti[] }) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useLayoutEffect(() => {
    // Dynamically import markercluster
    import("leaflet.markercluster").then(() => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }

      const cluster = L.markerClusterGroup({
        maxClusterRadius: 40,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (c) => {
          const count = c.getChildCount();
          return L.divIcon({
            html: `<div style="
              background: linear-gradient(135deg, #ff2d95, #a855f7);
              color: white;
              border-radius: 50%;
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 13px;
              border: 2px solid rgba(255,255,255,0.3);
              box-shadow: 0 0 12px rgba(255,45,149,0.5);
            ">${count}</div>`,
            className: "",
            iconSize: [36, 36],
          });
        },
      });

      graffiti.forEach((g) => {
        const marker = L.marker([g.latitude, g.longitude]);
        marker.bindPopup(`
          <div style="min-width:200px; color: #111;">
            <img src="${g.image_url}" alt="${g.prompt}"
              style="width:100%; height:128px; object-fit:cover; border-radius:6px; margin-bottom:8px;" />
            <p style="font-weight:bold; font-size:13px; margin:0 0 4px;">${g.prompt}</p>
            <p style="font-size:11px; color:#666; margin:0;">
              by ${g.creator || "Anonymous"} &middot; ${new Date(g.created_at).toLocaleDateString()}
            </p>
          </div>
        `);
        cluster.addLayer(marker);
      });

      map.addLayer(cluster);
      clusterRef.current = cluster;
    });

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
    };
  }, [map, graffiti]);

  return null;
}

const DEFAULT_CENTER: [number, number] = [51.758, -1.2602]; // Oxford

export default function MapView() {
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [graffiti, setGraffiti] = useState<Graffiti[]>([]);
  const [loading, setLoading] = useState(true);
  const [located, setLocated] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function init() {
      // Try to get GPS, fall back to default
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            });
          }
        );
        if (!mounted) return;
        setCenter([position.coords.latitude, position.coords.longitude]);
        setLocated(true);
      } catch {
        // use default Oxford center
      }

      // Always load ALL graffiti regardless of location
      const { data } = await supabase
        .from("graffiti")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (mounted && data) {
        setGraffiti(data as Graffiti[]);
        setLoading(false);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div
            className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3"
            style={{ borderColor: "#ff2d95", borderTopColor: "transparent" }}
          />
          <p className="text-white/60 text-sm font-mono">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={16}
      className="h-full w-full"
      style={{ background: "#0a0a0f" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {located && <RecenterMap lat={center[0]} lng={center[1]} />}
      <ClusteredMarkers graffiti={graffiti} />
    </MapContainer>
  );
}
