import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix icon mặc định của Leaflet
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

interface IProps {
    lat: number;
    lng: number;
    companyName: string;
    height?: number | string;
}

const JobMap: React.FC<IProps> = ({ lat, lng, companyName, height = 300 }) => {
    return (
        <MapContainer
            center={[lat, lng]}
            zoom={16}
            scrollWheelZoom={true}
            style={{
                height: typeof height === "number" ? `${height}px` : height,
                width: "100%",
                borderRadius: "10px",
            }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <Marker position={[lat, lng]}>
                <Popup>{companyName}</Popup>
            </Marker>
        </MapContainer>
    );
};

export default JobMap;
