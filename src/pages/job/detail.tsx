import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react';
import { IJob } from "@/types/backend";
import { callFetchJobById } from "@/config/api";
import styles from 'styles/client.module.scss';
import parse from 'html-react-parser';
import { Button, Col, Divider, Row, Skeleton, Tag } from "antd";
import { DollarOutlined, EnvironmentOutlined, HistoryOutlined, ExpandOutlined } from "@ant-design/icons";
import { getLocationName } from "@/config/utils";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ApplyModal from "@/components/client/modal/apply.modal";
import JobMap from "@/components/client/map/JobMap";

dayjs.extend(relativeTime);

const ClientJobDetailPage = () => {
    const [jobDetail, setJobDetail] = useState<IJob | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const location = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const id = params.get("id"); // job id

    useEffect(() => {
        const init = async () => {
            if (id) {
                setIsLoading(true);
                const res = await callFetchJobById(id);
                if (res?.data) {
                    setJobDetail(res.data);
                }
                setIsLoading(false);
            }
        };
        init();
    }, [id]);

    return (
        <div className={`${styles["container"]} ${styles["detail-job-section"]}`}>
            {isLoading ? (
                <Skeleton />
            ) : (
                <Row gutter={[20, 20]}>
                    {jobDetail && jobDetail.id && (
                        <>
                            <Col span={24} md={16}>
                                <div className={styles["header"]}>
                                    {jobDetail.name}
                                </div>
                                <div>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className={styles["btn-apply"]}
                                    >
                                        Apply Now
                                    </button>
                                </div>
                                <Divider />
                                <div className={styles["skills"]}>
                                    {jobDetail.skills?.map((item, index) => (
                                        <Tag key={`${index}-key`} color="gold">
                                            {item.name}
                                        </Tag>
                                    ))}
                                </div>
                                <div className={styles["salary"]}>
                                    <DollarOutlined />
                                    <span>
                                        &nbsp;
                                        {(jobDetail.salary + "")?.replace(/\B(?=(\d{3})+(?!\d))/g, ",")} đ
                                    </span>
                                </div>
                                <div className={styles["location"]}>
                                    <EnvironmentOutlined style={{ color: "#58aaab" }} />
                                    &nbsp;{getLocationName(jobDetail.location)}
                                </div>
                                <div>
                                    <HistoryOutlined />{" "}
                                    {jobDetail.updatedAt
                                        ? dayjs(jobDetail.updatedAt).locale("en").fromNow()
                                        : dayjs(jobDetail.createdAt).locale("en").fromNow()}
                                </div>
                                <Divider />
                                {parse(jobDetail.description)}
                            </Col>

                            <Col span={24} md={8}>
                                <div className={styles["company"]}>
                                    <div>
                                        <img
                                            width={"200px"}
                                            alt="example"
                                            src={`${import.meta.env.VITE_BACKEND_URL}/storage/company/${jobDetail.company?.logo}`}
                                        />
                                    </div>
                                    <div>{jobDetail.company?.name}</div>
                                </div>

                                {/* Map nhỏ + nút xem lớn */}
                                {jobDetail.latitude != null && jobDetail.longitude != null && (
                                    <div style={{ marginTop: 24 }}>
                                        <JobMap
                                            lat={jobDetail.latitude}
                                            lng={jobDetail.longitude}
                                            companyName={jobDetail.company?.name || jobDetail.name}
                                        // KHÔNG truyền startLat/startLng => không vẽ đường đi
                                        />
                                        {/* nút phóng to map */}
                                        <div style={{ marginTop: 8, textAlign: "right" }}>
                                            <Button
                                                type="link"
                                                icon={<ExpandOutlined />}
                                                onClick={() => navigate(`/job-map?id=${jobDetail.id}`)}
                                            >
                                                Xem bản đồ lớn
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Col>
                        </>
                    )}
                </Row>
            )}

            <ApplyModal
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                jobDetail={jobDetail}
            />
        </div>
    );
};

export default ClientJobDetailPage;
