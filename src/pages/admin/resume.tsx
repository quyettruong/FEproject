import DataTable from "@/components/client/data-table";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { IResume } from "@/types/backend";
import { ActionType, ProColumns, ProFormSelect } from "@ant-design/pro-components";
import { Space, message, notification, Popconfirm, Tooltip } from "antd";
import { useState, useRef } from "react";
import dayjs from "dayjs";
import { callDeleteResume, callSummarizeResume } from "@/config/api";
import queryString from "query-string";
import { fetchResume } from "@/redux/slice/resumeSlide";
import ViewDetailResume from "@/components/admin/resume/view.resume";
import { ALL_PERMISSIONS } from "@/config/permissions";
import Access from "@/components/share/access";
import { sfIn } from "spring-filter-query-builder";
import {
    EditOutlined,
    DeleteOutlined,
    DownloadOutlined,
    RobotOutlined,
} from "@ant-design/icons";

const ResumePage = () => {
    const tableRef = useRef<ActionType>();

    const isFetching = useAppSelector((state) => state.resume.isFetching);
    const meta = useAppSelector((state) => state.resume.meta);
    const resumes = useAppSelector((state) => state.resume.result);
    const dispatch = useAppDispatch();

    const [dataInit, setDataInit] = useState<IResume | null>(null);
    const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);

    const handleDeleteResume = async (id: string | undefined) => {
        if (!id) return;

        const res = await callDeleteResume(id);

        // API delete trả về data đã unwrap -> dùng statusCode trực tiếp
        if (res && res.statusCode === 200) {
            message.success("Xóa Resume thành công");
            reloadTable();
        } else {
            notification.error({
                message: "Có lỗi xảy ra",
                description: res?.message || "Không thể xóa resume",
            });
        }
    };

    const handleDownloadResume = (record: IResume) => {
        if (!record.url) {
            notification.warning({
                message: "Không tìm thấy file CV",
            });
            return;
        }

        const downloadUrl = `${import.meta.env.VITE_BACKEND_URL}/storage/resume/${record.url}`;
        window.open(downloadUrl, "_blank");
    };

    const reloadTable = () => {
        tableRef?.current?.reload();
    };

    const columns: ProColumns<IResume>[] = [
        {
            title: "Id",
            dataIndex: "id",
            width: 50,
            render: (_text, record) => (
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        setOpenViewDetail(true);
                        setDataInit(record);
                    }}
                >
                    {record.id}
                </a>
            ),
            hideInSearch: true,
        },
        {
            title: "Trạng Thái",
            dataIndex: "status",
            sorter: true,
            renderFormItem: () => (
                <ProFormSelect
                    showSearch
                    mode="multiple"
                    allowClear
                    valueEnum={{
                        PENDING: "PENDING",
                        REVIEWING: "REVIEWING",
                        APPROVED: "APPROVED",
                        REJECTED: "REJECTED",
                    }}
                    placeholder="Chọn level"
                />
            ),
        },
        {
            title: "Job",
            dataIndex: ["job", "name"],
            hideInSearch: true,
        },
        {
            title: "Company",
            dataIndex: "companyName",
            hideInSearch: true,
        },
        {
            title: "CreatedAt",
            dataIndex: "createdAt",
            width: 200,
            sorter: true,
            render: (_text, record) =>
                record.createdAt
                    ? dayjs(record.createdAt).format("DD-MM-YYYY HH:mm:ss")
                    : "",
            hideInSearch: true,
        },
        {
            title: "UpdatedAt",
            dataIndex: "updatedAt",
            width: 200,
            sorter: true,
            render: (_text, record) =>
                record.updatedAt
                    ? dayjs(record.updatedAt).format("DD-MM-YYYY HH:mm:ss")
                    : "",
            hideInSearch: true,
        },
        {
            title: "Actions",
            hideInSearch: true,
            width: 220,
            render: (_value, entity) => (
                <Space>
                    {/* Download: luôn cho phép */}
                    <DownloadOutlined
                        style={{
                            fontSize: 20,
                            color: "#1890ff",
                            cursor: "pointer",
                        }}
                        onClick={() => handleDownloadResume(entity)}
                    />

                    {/* Edit: chỉ hiện nếu có quyền UPDATE */}
                    <Access
                        permission={ALL_PERMISSIONS.RESUMES.UPDATE}
                        hideChildren={true}
                    >
                        <EditOutlined
                            style={{
                                fontSize: 20,
                                color: "#ffa500",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                setOpenViewDetail(true);
                                setDataInit(entity);
                            }}
                        />
                    </Access>

                    {/* Tóm tắt CV bằng AI */}
                    <Access permission={ALL_PERMISSIONS.RESUMES.AI_SUMMARY} hideChildren={true}>
                        <Tooltip title="Tóm tắt CV bằng AI">
                            <RobotOutlined
                                style={{ fontSize: 20, color: "#722ed1", cursor: "pointer" }}
                                onClick={() => {
                                    if (!entity.id) {
                                        message.error("Resume không hợp lệ");
                                        return;
                                    }

                                    callSummarizeResume(entity.id)
                                        .then((res) => {
                                            const data = res.data; // AxiosResponse -> data

                                            if (data?.statusCode === 200) {
                                                message.success("Tóm tắt CV thành công");
                                                reloadTable();
                                            } else {
                                                message.error(
                                                    data?.message || "Không thể tóm tắt CV",
                                                );
                                            }
                                        })
                                        .catch(() => message.error("Lỗi khi tóm tắt CV"));
                                }}
                            />
                        </Tooltip>
                    </Access>

                    {/* Delete: chỉ hiện nếu có quyền DELETE */}
                    <Access
                        permission={ALL_PERMISSIONS.RESUMES.DELETE}
                        hideChildren={true}
                    >
                        <Popconfirm
                            placement="leftTop"
                            title={"Xác nhận xóa resume"}
                            description={"Bạn có chắc chắn muốn xóa resume này ?"}
                            onConfirm={() => handleDeleteResume(String(entity.id))}
                            okText="Xác nhận"
                            cancelText="Hủy"
                        >
                            <span style={{ cursor: "pointer", margin: "0 10px" }}>
                                <DeleteOutlined
                                    style={{
                                        fontSize: 20,
                                        color: "#ff4d4f",
                                    }}
                                />
                            </span>
                        </Popconfirm>
                    </Access>
                </Space>
            ),
        },
    ];

    const buildQuery = (params: any, sort: any, _filter: any) => {
        const clone = { ...params };

        if (clone?.status?.length) {
            clone.filter = sfIn("status", clone.status).toString();
            delete clone.status;
        }

        clone.page = clone.current;
        clone.size = clone.pageSize;

        delete clone.current;
        delete clone.pageSize;

        let temp = queryString.stringify(clone);

        let sortBy = "";
        if (sort && sort.status) {
            sortBy = sort.status === "ascend" ? "sort=status,asc" : "sort=status,desc";
        }

        if (sort && sort.createdAt) {
            sortBy =
                sort.createdAt === "ascend"
                    ? "sort=createdAt,asc"
                    : "sort=createdAt,desc";
        }
        if (sort && sort.updatedAt) {
            sortBy =
                sort.updatedAt === "ascend"
                    ? "sort=updatedAt,asc"
                    : "sort=updatedAt,desc";
        }

        if (!sortBy) {
            temp = `${temp}&sort=updatedAt,desc`;
        } else {
            temp = `${temp}&${sortBy}`;
        }

        return temp;
    };

    return (
        <div>
            <Access permission={ALL_PERMISSIONS.RESUMES.GET_PAGINATE}>
                <DataTable<IResume>
                    actionRef={tableRef}
                    headerTitle="Danh sách Resumes"
                    rowKey="id"
                    loading={isFetching}
                    columns={columns}
                    dataSource={resumes}
                    request={async (params, sort, filter): Promise<any> => {
                        const query = buildQuery(params, sort, filter);
                        dispatch(fetchResume({ query }));
                    }}
                    scroll={{ x: true }}
                    pagination={{
                        current: meta.page,
                        pageSize: meta.pageSize,
                        showSizeChanger: true,
                        total: meta.total,
                        showTotal: (total, range) => (
                            <div>
                                {range[0]}-{range[1]} trên {total} rows
                            </div>
                        ),
                    }}
                    rowSelection={false}
                    toolBarRender={(_action, _rows): any => {
                        return <></>;
                    }}
                />
            </Access>

            <ViewDetailResume
                open={openViewDetail}
                onClose={setOpenViewDetail}
                dataInit={dataInit}
                setDataInit={setDataInit}
                reloadTable={reloadTable}
            />
        </div>
    );
};

export default ResumePage;
