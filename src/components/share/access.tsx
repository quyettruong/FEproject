import { useEffect, useState } from "react";
import { Result } from "antd";
import { useAppSelector } from "@/redux/hooks";

interface IProps {
    hideChildren?: boolean;
    children: React.ReactNode;
    permission: { method: string; apiPath: string; module: string };
}

const Access = (props: IProps) => {
    const { permission, hideChildren = false, children } = props;
    const [allow, setAllow] = useState<boolean>(true);

    const account = useAppSelector((state: any) => state.account);
    const user = account?.user;
    const role = user?.role;
    const permissions = role?.permissions || [];

    const aclDisabled = import.meta.env.VITE_ACL_ENABLE === "false";

    useEffect(() => {
        // Nếu tắt ACL trong env => cho qua hết
        if (aclDisabled) {
            setAllow(true);
            return;
        }

        // Nếu là ADMIN => cho qua hết
        if (role?.name === "ADMIN") {
            setAllow(true);
            return;
        }

        // Các role khác: check như logic cũ
        if (permissions.length > 0) {
            const matched = permissions.some(
                (item: any) =>
                    item.apiPath === permission.apiPath &&
                    item.method === permission.method &&
                    item.module === permission.module,
            );
            setAllow(matched);
        } else {
            setAllow(false);
        }
    }, [aclDisabled, role?.name, permissions, permission]);

    if (allow) {
        return <>{children}</>;
    }

    if (hideChildren) {
        return null;
    }

    return (
        <Result
            status="403"
            title="Truy cập bị từ chối"
            subTitle="Xin lỗi, bạn không có quyền hạn (permission) truy cập thông tin này"
        />
    );
};

export default Access;
