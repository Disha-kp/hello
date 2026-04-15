import { useEffect, useRef, useState } from 'react';
import { X, MapPin, Clock, Route, Navigation } from 'lucide-react';

// ─── Geocode place name → { lat, lon } via Nominatim ───────────────────────
async function geocode(place) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (data && data.length > 0) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } catch (e) { console.error('Geocode error:', e); }
    return null;
}

// ─── OSRM route (bidirectional Dijkstra) ───────────────────────────────────
async function fetchOSRMRoute(srcLat, srcLon, dstLat, dstLon) {
    try {
        const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${srcLon},${srcLat};${dstLon},${dstLat}` +
            `?overview=full&geometries=geojson&steps=false`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.code === 'Ok' && data.routes.length > 0) {
            const route = data.routes[0];
            const coords = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);
            return {
                coords,
                distanceKm: (route.distance / 1000).toFixed(1),
                durationMin: Math.round(route.duration / 60),
            };
        }
    } catch (e) { console.error('OSRM error:', e); }
    return null;
}

// ─── Icon helpers ───────────────────────────────────────────────────────────
function makeCircleIcon(L, color, label = '') {
    return L.divIcon({
        className: '',
        html: `<div style="width:18px;height:18px;background:${color};border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:8px;color:white;font-weight:bold;">${label}</div>`,
        iconSize: [18, 18], iconAnchor: [9, 9], popupAnchor: [0, -12],
    });
}

function makeDriverIcon(L) {
    return L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;background:#008080;border:3px solid white;border-radius:50%;box-shadow:0 2px 12px rgba(0,128,128,0.55);display:flex;align-items:center;justify-content:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
        </div>`,
        iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -16],
    });
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function RouteMapModal({
    isOpen,
    onClose,
    origin,
    destination,
    driverLocation = null,      // { lat, lon } — updates live
    passengerPickups = [],       // [{ lat, lon, name }] — updates live
}) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef({});
    const [routeInfo, setRouteInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // ── Build map once when opened ─────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        let alive = true;

        (async () => {
            setLoading(true);
            setError('');
            try {
                const L = (await import('leaflet')).default;
                delete L.Icon.Default.prototype._getIconUrl;
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                });

                const [srcCoords, dstCoords] = await Promise.all([geocode(origin), geocode(destination)]);
                if (!alive) return;
                if (!srcCoords || !dstCoords) {
                    setError('Could not locate one or both addresses. Try more specific place names.');
                    setLoading(false);
                    return;
                }

                const routeData = await fetchOSRMRoute(srcCoords.lat, srcCoords.lon, dstCoords.lat, dstCoords.lon);
                if (!alive) return;
                if (routeData) setRouteInfo({ distance: routeData.distanceKm, eta: routeData.durationMin });

                // Wait a tick for the DOM ref to be visible
                await new Promise(r => setTimeout(r, 80));
                if (!mapRef.current || !alive) return;

                if (mapInstanceRef.current) {
                    mapInstanceRef.current.remove();
                    mapInstanceRef.current = null;
                    markersRef.current = {};
                }

                const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false });
                mapInstanceRef.current = map;
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

                // Pickup + dropoff markers
                markersRef.current.origin = L.marker([srcCoords.lat, srcCoords.lon], { icon: makeCircleIcon(L, '#008080') })
                    .addTo(map).bindPopup(`<b>📍 Pickup</b><br>${origin}`);
                markersRef.current.dest = L.marker([dstCoords.lat, dstCoords.lon], { icon: makeCircleIcon(L, '#ef4444') })
                    .addTo(map).bindPopup(`<b>🏁 Dropoff</b><br>${destination}`);

                // Route line
                if (routeData) {
                    const poly = L.polyline(routeData.coords, { color: '#008080', weight: 5, opacity: 0.85 }).addTo(map);
                    map.fitBounds(poly.getBounds(), { padding: [40, 40] });
                } else {
                    const fallback = L.polyline([[srcCoords.lat, srcCoords.lon], [dstCoords.lat, dstCoords.lon]], { color: '#008080', weight: 4, dashArray: '8,5', opacity: 0.7 }).addTo(map);
                    map.fitBounds(fallback.getBounds(), { padding: [40, 40] });
                }

                // Initial driver pin (if already known)
                if (driverLocation?.lat && driverLocation?.lon) {
                    markersRef.current.driver = L.marker([driverLocation.lat, driverLocation.lon], { icon: makeDriverIcon(L) })
                        .addTo(map).bindPopup('<b>🚗 Driver</b>');
                }

                // Initial passenger pins
                passengerPickups.forEach((p, i) => {
                    if (p.lat && p.lon) {
                        markersRef.current[`p_${i}`] = L.marker([p.lat, p.lon], { icon: makeCircleIcon(L, '#3b82f6', i + 1) })
                            .addTo(map).bindPopup(`<b>👤 Rider ${i + 1}</b>${p.name ? '<br>' + p.name : ''}`);
                    }
                });

                setLoading(false);
            } catch (err) {
                console.error('Map error:', err);
                if (alive) { setError('Failed to load map. Check your internet connection.'); setLoading(false); }
            }
        })();

        return () => { alive = false; };
    }, [isOpen, origin, destination]);

    // ── Live driver pin update (no re-init) ────────────────────────────────
    useEffect(() => {
        if (!isOpen || !mapInstanceRef.current || !driverLocation?.lat) return;
        (async () => {
            const L = (await import('leaflet')).default;
            if (!mapInstanceRef.current) return;
            if (markersRef.current.driver) {
                markersRef.current.driver.setLatLng([driverLocation.lat, driverLocation.lon]);
            } else {
                markersRef.current.driver = L.marker([driverLocation.lat, driverLocation.lon], { icon: makeDriverIcon(L) })
                    .addTo(mapInstanceRef.current).bindPopup('<b>🚗 Driver</b>');
            }
        })();
    }, [driverLocation, isOpen]);

    // ── Live passenger pins update ─────────────────────────────────────────
    useEffect(() => {
        if (!isOpen || !mapInstanceRef.current || passengerPickups.length === 0) return;
        (async () => {
            const L = (await import('leaflet')).default;
            if (!mapInstanceRef.current) return;
            passengerPickups.forEach((p, i) => {
                if (!p.lat || !p.lon) return;
                const key = `p_${i}`;
                if (markersRef.current[key]) {
                    markersRef.current[key].setLatLng([p.lat, p.lon]);
                } else {
                    markersRef.current[key] = L.marker([p.lat, p.lon], { icon: makeCircleIcon(L, '#3b82f6', i + 1) })
                        .addTo(mapInstanceRef.current).bindPopup(`<b>👤 Rider ${i + 1}</b>${p.name ? '<br>' + p.name : ''}`);
                }
            });
        })();
    }, [passengerPickups, isOpen]);

    // ── Destroy map on close ───────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen && mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            markersRef.current = {};
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

                <div className="bg-[#008080] px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Route className="w-5 h-5 text-white" />
                        <h3 className="text-white font-bold text-lg">Route Preview</h3>
                    </div>
                    <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full text-white transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-5 py-3 bg-teal-50 border-b border-teal-100 flex items-center space-x-2 flex-wrap gap-y-1">
                    <div className="flex items-center space-x-1.5 text-sm font-medium text-teal-800">
                        <span className="w-3 h-3 bg-[#008080] rounded-full border-2 border-white shadow-sm flex-shrink-0" />
                        <span className="truncate max-w-[110px]">{origin}</span>
                    </div>
                    <Navigation className="w-4 h-4 text-teal-400 flex-shrink-0" />
                    <div className="flex items-center space-x-1.5 text-sm font-medium text-teal-800">
                        <span className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm flex-shrink-0" />
                        <span className="truncate max-w-[110px]">{destination}</span>
                    </div>
                </div>

                <div className="relative h-64 bg-gray-100">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-50">
                            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-2" />
                            <p className="text-gray-400 text-sm">Calculating route via OSRM...</p>
                        </div>
                    )}
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gray-50 p-4">
                            <p className="text-red-500 text-sm text-center">{error}</p>
                        </div>
                    )}
                    <div ref={mapRef} className="w-full h-full" style={{ visibility: loading || error ? 'hidden' : 'visible' }} />
                </div>

                {routeInfo && (
                    <div className="grid grid-cols-2 divide-x divide-gray-100 border-t border-gray-100">
                        <div className="p-4 flex items-center space-x-3">
                            <div className="bg-teal-50 p-2 rounded-full"><MapPin className="w-4 h-4 text-[#008080]" /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Distance</p>
                                <p className="font-bold text-gray-900">{routeInfo.distance} km</p>
                            </div>
                        </div>
                        <div className="p-4 flex items-center space-x-3">
                            <div className="bg-teal-50 p-2 rounded-full"><Clock className="w-4 h-4 text-[#008080]" /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Est. Time</p>
                                <p className="font-bold text-gray-900">{routeInfo.eta} min</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="px-5 pb-4 pt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#008080] inline-block" />Pickup</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Dropoff</span>
                    {driverLocation && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#008080] border-2 border-white shadow inline-block" />Driver (live)</span>}
                    {passengerPickups.length > 0 && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Riders</span>}
                </div>
            </div>
        </div>
    );
}
