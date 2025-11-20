import React, { useState } from "react";
import { Form, Input, Button, Typography, Divider, message } from "antd";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { callResetPasswordPublic } from "config/api";

const { Title, Text } = Typography;

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const onFinish = async (values: { password: string; confirmPassword: string }) => {
        if (!token) {
            message.error("Token không hợp lệ hoặc đã hết hạn");
            return;
        }

        try {
            setLoading(true);

            // Gọi API PUBLIC không đi qua axios-customize, không gửi Authorization
            await callResetPasswordPublic(token, values.password);

            // Nếu không ném lỗi thì coi như thành công (status 2xx)
            message.success("Đặt lại mật khẩu thành công! Hãy đăng nhập lại.");
            navigate("/login");
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Có lỗi xảy ra khi đặt lại mật khẩu";
            message.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f3f3f3",
                padding: 20,
            }}
        >
            <div
                style={{
                    width: 480,
                    maxWidth: "100%",
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: "32px 32px 28px",
                    boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
                }}
            >
                <Title level={2} style={{ textAlign: "center", marginBottom: 24 }}>
                    Đặt lại mật khẩu
                </Title>

                <Text type="secondary" style={{ display: "block", textAlign: "center", marginBottom: 24 }}>
                    Nhập mật khẩu mới cho tài khoản của bạn.
                </Text>

                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        name="password"
                        label="Mật khẩu mới"
                        rules={[
                            { required: true, message: "Vui lòng nhập mật khẩu mới!" },
                            { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                        ]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu mới" />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Xác nhận mật khẩu"
                        dependencies={["password"]}
                        rules={[
                            { required: true, message: "Vui lòng xác nhận mật khẩu!" },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue("password") === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error("Mật khẩu không khớp!"));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>

                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={loading}
                        style={{ marginTop: 8 }}
                    >
                        Xác nhận
                    </Button>
                </Form>

                <Divider style={{ margin: "24px 0 16px" }}>Hoặc</Divider>

                <div style={{ textAlign: "center" }}>
                    Quay lại{" "}
                    <Link to="/login" style={{ fontWeight: 500 }}>
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
