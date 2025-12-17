import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { Button, Spin } from "antd";
import { IJob } from "@/types/backend";
import { callFetchJobById } from "@/config/api";
import RoutingControl from "./RoutingControl";

const JobMapPage: React.FC = () => {
    const [job, setJob] = useState<IJob | null>(null);
    const [loading, setLoading] = useState(false);

    const [startLat, setStartLat] = useState<number | null>(null);
    const [startLng, setStartLng] = useState<number | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const id = params.get("id"); // lấy ?id= trên URL

    // Lấy thông tin job
    useEffect(() => {
        const init = async () => {
            if (!id) return;
            setLoading(true);
            const res = await callFetchJobById(id);
            if (res?.data) {
                setJob(res.data);
            }
            setLoading(false);
        };
        init();
    }, [id]);

    const handleUseMyLocation = () => {
        if (!navigator.geolocation) {
            alert("Trình duyệt không hỗ trợ định vị");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;

                console.log("Vị trí hiện tại:", latitude, longitude, "Độ chính xác:", accuracy);

                setStartLat(latitude);
                setStartLng(longitude);
            },
            (err) => {
                console.error("Lỗi lấy vị trí:", err);
                alert("Không thể lấy vị trí hiện tại. Hãy bật GPS và thử lại!");
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );

    };

    if (loading || !job) {
        return (
            <div style={{ padding: 16 }}>
                <Button onClick={() => navigate(-1)}>← Quay lại</Button>
                <div style={{ marginTop: 24, textAlign: "center" }}>
                    <Spin />
                </div>
            </div>
        );
    }

    // Nếu job không có tọa độ thì báo nhẹ
    if (job.latitude == null || job.longitude == null) {
        return (
            <div style={{ padding: 16 }}>
                <Button onClick={() => navigate(-1)}>← Quay lại</Button>
                <p style={{ marginTop: 24 }}>
                    Job này chưa có thông tin vị trí (latitude/longitude).
                </p>
            </div>
        );
    }

    const lat = job.latitude;
    const lng = job.longitude;

    return (
        <div style={{ padding: 16 }}>
            <Button onClick={() => navigate(-1)}>← Quay lại</Button>
            <Button style={{ marginLeft: 8 }} onClick={handleUseMyLocation}>
                Đường đi từ vị trí của tôi
            </Button>

            <div style={{ marginTop: 16 }}>
                <MapContainer
                    center={[lat, lng]}
                    zoom={16}
                    scrollWheelZoom={true}
                    style={{
                        height: "70vh", // kéo cao hơn, đỡ khoảng trắng
                        width: "100%",
                        borderRadius: "10px",
                    }}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    <Marker position={[lat, lng]} />

                    {/* Có vị trí người dùng rồi thì vẽ đường đi ngắn nhất */}
                    {startLat != null && startLng != null && (
                        <RoutingControl start={[startLat, startLng]} end={[lat, lng]} />
                    )}
                </MapContainer>
            </div>
        </div>
    );
};

export default JobMapPage;
