import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issues in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Colored Icons
const createIcon = (color) => {
    return new L.Icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

const redIcon = createIcon('red');
const blueIcon = createIcon('blue');
const greenIcon = createIcon('green');

const HUBS = [
    { id: 1, name: "JNTU Metro Station", lat: 17.4933, lng: 78.3914, icon: redIcon },
    { id: 2, name: "Hitech City Mindspace", lat: 17.4435, lng: 78.3772, icon: blueIcon },
    { id: 3, name: "Secunderabad Station", lat: 17.4399, lng: 78.5000, icon: greenIcon },
];

export default function Map() {
    const position = [17.3850, 78.4867]; // Hyderabad

    return (
        <div className="h-full w-full relative z-0">
            <MapContainer
                center={position}
                zoom={11}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {HUBS.map((hub) => (
                    <Marker
                        key={hub.id}
                        position={[hub.lat, hub.lng]}
                        icon={hub.icon}
                    >
                        <Popup>
                            <div className="font-sans">
                                <h3 className="font-bold text-sm text-gray-800">{hub.name}</h3>
                                <p className="text-xs text-gray-500">AI Cluster Hub</p>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Overlay Gradient at top for better navbar visibility if needed */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/80 to-transparent pointer-events-none z-[400]"></div>
        </div>
    );
}
