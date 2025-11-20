import { useState } from "react";
import {
    Form,
    Input,
    Button,
    Typography,
    Divider,
    message,
} from "antd";
import { Link } from "react-router-dom";
import { callForgotPassword } from "config/api";

const { Title, Text } = Typography;

// style đơn giản, tự viết trong file
const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
};

const cardStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: "32px 28px",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
};

const titleStyle: React.CSSProperties = {
    textAlign: "center",
    marginBottom: 24,
};

const ForgotPasswordPage = () => {
    const [isLoading, setIsLoading] = useState(false);

    const onFinish = async (values: { email: string }) => {
        try {
            setIsLoading(true);

            const res = await callForgotPassword(values.email);
            const result: any = res?.data; // dùng any cho đỡ gắt TS

            setIsLoading(false);

            if (result?.statusCode === 200) {
                message.success(
                    result?.message ||
                    "Nếu email hợp lệ, hệ thống đã gửi hướng dẫn đặt lại mật khẩu!"
                );
            } else {
                message.error(result?.message || "Có lỗi xảy ra, vui lòng thử lại!");
            }
        } catch (e: any) {
            setIsLoading(false);
            message.error(
                e?.response?.data?.message || "Không thể gửi yêu cầu, thử lại sau!"
            );
        }
    };

    return (
        <div style={pageStyle}>
            <div style={cardStyle}>
                <Title level={2} style={titleStyle}>
                    Quên mật khẩu
                </Title>

                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                            { required: true, message: "Vui lòng nhập email!" },
                            { type: "email", message: "Email không hợp lệ!" },
                        ]}
                    >
                        <Input placeholder="Nhập email của bạn..." />
                    </Form.Item>

                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isLoading}
                        block
                        style={{ marginTop: 8 }}
                    >
                        Gửi yêu cầu
                    </Button>
                </Form>

                <Text
                    type="secondary"
                    style={{
                        marginTop: 10,
                        display: "block",
                        textAlign: "center",
                        fontSize: 13,
                    }}
                >
                    Kiểm tra email trong Mailtrap để lấy link đặt lại mật khẩu.
                </Text>

                <Divider style={{ marginTop: 18, marginBottom: 16 }}>Hoặc</Divider>

                <div style={{ textAlign: "center", fontSize: 14 }}>
                    Nhớ mật khẩu rồi? <Link to="/login">Đăng nhập</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
