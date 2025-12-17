import React, { useEffect, useState } from "react";
import {
    Modal,
    Descriptions,
    Tag,
    Button,
    Typography,
    message,
    Select,
} from "antd";
import dayjs from "dayjs";
import { IResume } from "@/types/backend";
import {
    callSummarizeResume,
    callUpdateResumeStatus,
} from "@/config/api";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Access from "@/components/share/access";

const { Paragraph, Text } = Typography;

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IResume | null;
    setDataInit: (v: IResume | null) => void;
    reloadTable: () => void;
}

const statusColor: Record<string, string> = {
    PENDING: "default",
    REVIEWING: "processing",
    APPROVED: "success",
    REJECTED: "error",
};

const ViewDetailResume: React.FC<IProps> = (props) => {
    const { open, onClose, dataInit, reloadTable, setDataInit } = props;

    const [loading, setLoading] = useState(false);
    const [currentStatus, setCurrentStatus] = useState<string | undefined>(
        dataInit?.status,
    );

    // mỗi lần mở 1 CV khác thì sync lại trạng thái
    useEffect(() => {
        setCurrentStatus(dataInit?.status);
    }, [dataInit]);

    // ====== TỰ ĐỘNG TÓM TẮT CV KHI MỞ MODAL ======
    useEffect(() => {
        if (
            open &&
            dataInit?.id &&
            !dataInit.summaryAi &&
            !loading
        ) {
            handleSummarize();
        }
    }, [open, dataInit?.id]);


    const handleClose = () => {
        onClose(false);
    };

    // ====== GỌI AI TÓM TẮT CV ======
    const handleSummarize = async () => {
        if (!dataInit?.id) {
            message.error("Resume không hợp lệ");
            return;
        }

        try {
            setLoading(true);

            // res = { statusCode, message, data: { resumeId, summaryAi } }
            const res = await callSummarizeResume(dataInit.id);

            if (res?.statusCode === 200) {
                message.success("Tóm tắt CV thành công");

                // cập nhật ngay nội dung đang mở modal (không cần đóng/mở lại)
                props.setDataInit({
                    ...dataInit,
                    summaryAi: res?.data?.summaryAi,
                });

                reloadTable();
            } else {
                message.error(res?.message || "Không thể tóm tắt CV");
            }
        } catch (e) {
            message.error("Lỗi khi tóm tắt CV");
        } finally {
            setLoading(false);
        }
    };


    const handleUpdateStatus = async () => {
        if (!dataInit?.id) {
            message.error("Resume không hợp lệ");
            return;
        }

        if (!currentStatus) {
            message.error("Vui lòng chọn trạng thái");
            return;
        }

        if (currentStatus === dataInit.status) {
            handleClose();
            return;
        }

        try {
            setLoading(true);

            // gửi body { id, status } đúng với BE
            const res = await callUpdateResumeStatus({
                id: dataInit.id,
                status: currentStatus,
            });

            // res = { statusCode, message, data }
            if (res?.statusCode === 200) {
                message.success(res.message || "Cập nhật trạng thái thành công");
                reloadTable();
                onClose(false);
            } else {
                message.error(res?.message || "Không thể cập nhật trạng thái");
            }
        } catch (e) {
            message.error("Không thể cập nhật trạng thái");
        } finally {
            setLoading(false);
        }
    };




    return (
        <Modal
            open={open}
            title={
                dataInit ? `Thông tin Resume #${dataInit.id}` : "Thông tin Resume"
            }
            onCancel={handleClose}
            footer={[
                // nút AI summary: chỉ ẩn nút khi không đủ quyền, KHÔNG render 403
                <Access
                    key="ai"
                    permission={ALL_PERMISSIONS.RESUMES.AI_SUMMARY}
                    hideChildren
                >
                    <Button
                        type="primary"
                        loading={loading}
                        onClick={handleSummarize}
                    >
                        Tóm tắt CV bằng AI
                    </Button>
                </Access>,

                // nút Lưu trạng thái: cũng chỉ ẩn nút
                <Access
                    key="update"
                    permission={ALL_PERMISSIONS.RESUMES.UPDATE}
                    hideChildren
                >
                    <Button
                        type="primary"
                        ghost
                        loading={loading}
                        onClick={handleUpdateStatus}
                    >
                        Lưu trạng thái
                    </Button>
                </Access>,

                <Button key="close" onClick={handleClose}>
                    Đóng
                </Button>,
            ]}
            destroyOnClose
            width={900}
        >
            {dataInit && (
                <Descriptions column={2} bordered>
                    <Descriptions.Item label="Id">
                        {dataInit.id}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        <Select
                            style={{ minWidth: 160 }}
                            value={currentStatus}
                            onChange={setCurrentStatus}
                            options={[
                                { value: "PENDING", label: "PENDING" },
                                { value: "REVIEWING", label: "REVIEWING" },
                                { value: "APPROVED", label: "APPROVED" },
                                { value: "REJECTED", label: "REJECTED" },
                            ]}
                        />
                        {currentStatus && (
                            <Tag
                                color={statusColor[currentStatus]}
                                style={{ marginLeft: 8 }}
                            >
                                {currentStatus}
                            </Tag>
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Email">
                        {dataInit.email}
                    </Descriptions.Item>

                    <Descriptions.Item label="File CV">
                        {dataInit.url}
                    </Descriptions.Item>

                    <Descriptions.Item label="Job">
                        {dataInit.job?.name}
                    </Descriptions.Item>

                    <Descriptions.Item label="Company">
                        {dataInit.companyName || dataInit.job?.company?.name}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dataInit.createdAt
                            ? dayjs(dataInit.createdAt).format(
                                "DD-MM-YYYY HH:mm:ss",
                            )
                            : ""}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày sửa">
                        {dataInit.updatedAt
                            ? dayjs(dataInit.updatedAt).format(
                                "DD-MM-YYYY HH:mm:ss",
                            )
                            : ""}
                    </Descriptions.Item>

                    {/* TÓM TẮT CV BẰNG AI */}
                    <Descriptions.Item label="Tóm tắt CV (AI)" span={2}>
                        {dataInit.summaryAi ? (
                            <Paragraph
                                style={{
                                    whiteSpace: "pre-line",
                                    marginBottom: 0,
                                }}
                            >
                                {dataInit.summaryAi}
                            </Paragraph>
                        ) : (
                            <Text type="secondary">
                                Chưa có tóm tắt. Bấm nút "Tóm tắt CV bằng AI" để
                                tạo.
                            </Text>
                        )}
                    </Descriptions.Item>
                </Descriptions>
            )}
        </Modal>
    );
};

export default ViewDetailResume;
