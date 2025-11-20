import { IBackendRes } from "@/types/backend";
import { Mutex } from "async-mutex";
import axiosClient from "axios";
import { store } from "@/redux/store";
import { setRefreshTokenAction } from "@/redux/slice/accountSlide";
import { notification } from "antd";

interface AccessTokenResponse {
    access_token: string;
}

/**
 * Creates an initial 'axios' instance with custom settings.
 */
const instance = axiosClient.create({
    baseURL: import.meta.env.VITE_BACKEND_URL as string,
    withCredentials: true,
});

const mutex = new Mutex();
const NO_RETRY_HEADER = "x-no-retry";

// Các endpoint AUTH public: không gắn Authorization, không auto-refresh
const publicAuthPaths = [
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/reset-password",
    "/api/v1/auth/refresh",
];

const handleRefreshToken = async (): Promise<string | null> => {
    return await mutex.runExclusive(async () => {
        const res = await instance.get<IBackendRes<AccessTokenResponse>>(
            "/api/v1/auth/refresh"
        );
        // res đã là IBackendRes<AccessTokenResponse> vì response interceptor trả res.data
        if (res && res.data) return res.data.access_token;
        else return null;
    });
};

instance.interceptors.request.use(function (config) {
    const url = config.url || "";
    const isPublicAuth = publicAuthPaths.some((p) => url.startsWith(p));

    // chỉ gắn Bearer cho các request KHÔNG nằm trong publicAuthPaths
    if (
        typeof window !== "undefined" &&
        window &&
        window.localStorage &&
        window.localStorage.getItem("access_token") &&
        !isPublicAuth
    ) {
        config.headers = config.headers || {};
        config.headers.Authorization =
            "Bearer " + window.localStorage.getItem("access_token");
    }

    if (!config.headers.Accept && config.headers["Content-Type"]) {
        config.headers.Accept = "application/json";
        config.headers["Content-Type"] = "application/json; charset=utf-8";
    }
    return config;
});

/**
 * Handle all responses.
 */
instance.interceptors.response.use(
    (res) => res.data,
    async (error) => {
        const cfg = error.config || {};
        const url = cfg.url || "";

        // 1) Auto refresh token cho các request 401, nhưng KHÔNG áp dụng cho các auth endpoint public
        if (
            cfg &&
            error.response &&
            +error.response.status === 401 &&
            !cfg.headers?.[NO_RETRY_HEADER] &&
            !publicAuthPaths.includes(url) // không refresh cho login/forgot/reset/refresh
        ) {
            const access_token = await handleRefreshToken();
            cfg.headers[NO_RETRY_HEADER] = "true";
            if (access_token) {
                cfg.headers["Authorization"] = `Bearer ${access_token}`;
                localStorage.setItem("access_token", access_token);
                return instance.request(cfg);
            }
        }

        // 2) Refresh bị 400 khi đang ở /admin => đẩy về redux để logout / báo lỗi
        if (
            cfg &&
            error.response &&
            +error.response.status === 400 &&
            url === "/api/v1/auth/refresh" &&
            location.pathname.startsWith("/admin")
        ) {
            const message = error?.response?.data?.error ?? "Có lỗi xảy ra, vui lòng login.";
            store.dispatch(setRefreshTokenAction({ status: true, message }));
        }

        // 3) 403 => show notification
        if (+error?.response?.status === 403) {
            notification.error({
                message: error?.response?.data?.message ?? "",
                description: error?.response?.data?.error ?? "",
            });
        }

        return error?.response?.data ?? Promise.reject(error);
    }
);

export default instance;
