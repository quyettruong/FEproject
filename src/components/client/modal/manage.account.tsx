import {
    Button,
    Col,
    Form,
    Modal,
    Row,
    Select,
    Table,
    Tabs,
    message,
    notification,
    Input,
} from "antd";
import { isMobile } from "react-device-detect";
import type { TabsProps } from "antd";
import { IResume } from "@/types/backend";
import { useState, useEffect } from "react";
import {
    callFetchResumeByUser,
    callUpdateProfile,
    callChangePassword,
} from "@/config/api";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { MonitorOutlined } from "@ant-design/icons";
import { useAppSelector } from "@/redux/hooks";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
}

/**
 * TAB 1: Danh sách CV đã rải
 */
const UserResume = (props: any) => {
    const [listCV, setListCV] = useState<IResume[]>([]);
    const [isFetching, setIsFetching] = useState<boolean>(false);

    useEffect(() => {
        const init = async () => {
            setIsFetching(true);
            const res = await callFetchResumeByUser();
            if (res && res.data) {
                setListCV(res.data.result as IResume[]);
            }
            setIsFetching(false);
        };
        init();
    }, []);

    const columns: ColumnsType<IResume> = [
        {
            title: "STT",
            key: "index",
            width: 50,
            align: "center",
            render: (text, record, index) => {
                return <>{index + 1}</>;
            },
        },
        {
            title: "Công Ty",
            dataIndex: "companyName",
        },
        {
            title: "Job title",
            dataIndex: ["job", "name"],
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
        },
        {
            title: "Ngày rải CV",
            dataIndex: "createdAt",
            render(value, record, index) {
                return <>{dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss")}</>;
            },
        },
        {
            title: "",
            dataIndex: "",
            render(value, record, index) {
                return (
                    <a
                        href={`${import.meta.env.VITE_BACKEND_URL}/storage/resume/${record?.url
                            }`}
                        target="_blank"
                    >
                        Chi tiết
                    </a>
                );
            },
        },
    ];

    return (
        <div>
            <Table<IResume>
                columns={columns}
                dataSource={listCV}
                loading={isFetching}
                pagination={false}
            />
        </div>
    );
};

/**
 * TAB 2: Cập nhật thông tin user hiện tại
 */
const UserUpdateInfo = (props: any) => {
    const [form] = Form.useForm();
    const user = useAppSelector((state) => state.account.user);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            form.setFieldsValue({
                name: user.name,
                email: user.email
            });
        }
    }, [user]);


    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            const res = await callUpdateProfile(
                values.name,
                values.address,
                values.age
            );
            if (res?.statusCode === 200) {
                message.success("Cập nhật thông tin thành công");
            } else {
                message.error(res?.message || "Có lỗi xảy ra");
            }
        } catch (e: any) {
            message.error("Có lỗi xảy ra khi cập nhật thông tin");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form layout="vertical" form={form} onFinish={onFinish}>
            <Row gutter={[20, 20]}>
                <Col xs={24} md={12}>
                    <Form.Item
                        label="Họ tên"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
                    >
                        <Input placeholder="Nhập họ tên" />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item label="Địa chỉ" name="address">
                        <Input placeholder="Nhập địa chỉ" />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item label="Tuổi" name="age">
                        <Input type="number" placeholder="Nhập tuổi" />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Lưu thay đổi
                    </Button>
                </Col>
            </Row>
        </Form>
    );
};



/**
 * TAB 4: Đổi mật khẩu khi đã đăng nhập
 */
const UserChangePassword = (props: any) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onFinish = async (values: any) => {
        if (values.newPassword !== values.confirmPassword) {
            message.error("Mật khẩu mới và xác nhận không khớp");
            return;
        }

        try {
            setLoading(true);
            const res = await callChangePassword(
                values.currentPassword,
                values.newPassword
            );
            if (res?.statusCode === 200) {
                message.success("Đổi mật khẩu thành công");
                form.resetFields();
            } else {
                message.error(res?.message || "Có lỗi xảy ra");
            }
        } catch (e: any) {
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                "Có lỗi xảy ra khi đổi mật khẩu";
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form layout="vertical" form={form} onFinish={onFinish}>
            <Row gutter={[20, 20]}>
                <Col span={24}>
                    <Form.Item
                        name="currentPassword"
                        label="Mật khẩu hiện tại"
                        rules={[
                            { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
                        ]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu hiện tại" />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item
                        name="newPassword"
                        label="Mật khẩu mới"
                        rules={[
                            { required: true, message: "Vui lòng nhập mật khẩu mới" },
                            { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                        ]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu mới" />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Form.Item
                        name="confirmPassword"
                        label="Xác nhận mật khẩu mới"
                        dependencies={["newPassword"]}
                        rules={[
                            { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("newPassword") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(
                                        new Error("Mật khẩu mới và xác nhận không khớp")
                                    );
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>
                </Col>

                <Col span={24}>
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Đổi mật khẩu
                    </Button>
                </Col>
            </Row>
        </Form>
    );
};

/**
 * Modal chính
 */
const ManageAccount = (props: IProps) => {
    const { open, onClose } = props;

    const onChange = (key: string) => {
        // có thể log tab nếu cần
    };

    const items: TabsProps["items"] = [
        {
            key: "user-resume",
            label: `Rải CV`,
            children: <UserResume />,
        },
        {
            key: "user-update-info",
            label: `Cập nhật thông tin`,
            children: <UserUpdateInfo />,
        },
        {
            key: "user-password",
            label: `Thay đổi mật khẩu`,
            children: <UserChangePassword />,
        },
    ];

    return (
        <>
            <Modal
                title="Quản lý tài khoản"
                open={open}
                onCancel={() => onClose(false)}
                maskClosable={false}
                footer={null}
                destroyOnClose={true}
                width={isMobile ? "100%" : "1000px"}
            >
                <div style={{ minHeight: 400 }}>
                    <Tabs defaultActiveKey="user-resume" items={items} onChange={onChange} />
                </div>
            </Modal>
        </>
    );
};

export default ManageAccount;
