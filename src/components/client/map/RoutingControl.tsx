import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

interface Props {
    start: [number, number];
    end: [number, number];
}

const RoutingControl: React.FC<Props> = ({ start, end }) => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        // dùng any cho đỡ lỗi TS vì L.Routing không có type
        const routingControl = (L as any).Routing.control({
            waypoints: [
                L.latLng(start[0], start[1]),
                L.latLng(end[0], end[1]),
            ],
            addWaypoints: false,
            routeWhileDragging: false,
            show: false,
            lineOptions: {
                styles: [{ color: "#1d4ed8", weight: 5 }],
            },
            createMarker: () => null, // không thêm marker mới
        }).addTo(map);

        // cleanup khi unmount hoặc đổi start/end
        return () => {
            map.removeControl(routingControl);
        };
    }, [map, start, end]);

    return null;
};

export default RoutingControl;
