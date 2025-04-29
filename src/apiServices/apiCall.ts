import { message } from "antd";
import axios, { AxiosError, AxiosRequestConfig, Method } from "axios";

export interface CommonResponse<T> {
  status: number;
  message?: string;
  data?: T;
}
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const instance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
export const apiRequest = async <T>(
  method: Method,
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<CommonResponse<T>> => {
  console.log("Making API request:", method, url, data);
  try {
    const response = await instance.request<CommonResponse<T>>({
      method,
      url,
      data,
      ...config,
    });
    console.log(response);
    if (response.status === 200) {
      message.success(response.data.message || "Request successful");
    }
    return {
      status: response.data.status,
      message: response.data.message || "Request successful",
      data: response.data.data,
    };
  } catch (error) {
    const err = error as AxiosError;
    const statusCode = err.response?.status || 500;
    if (statusCode === 401) {
      message.error("Session expired. Please login again.");
      window.location.href = "/";
      return {
        status: 401,
        message: "Session expired. Please login again.",
        data: undefined,
      };
    }
    let errorMessage = "An unexpected error occurred.";
    if (err.code === "ECONNABORTED") {
      errorMessage = "Request timeout.";
    } else if (err.response?.data) {
      const errorData = err.response.data as CommonResponse<any>;
      errorMessage = errorData.message || getStatusMessage(statusCode);
    } else if (err.message) {
      errorMessage = err.message;
    }

    return {
      status: statusCode,
      message: errorMessage,
      data: undefined,
    };
  }
};

const getStatusMessage = (status: number): string => {
  switch (status) {
    case 400:
      return "Bad request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not found";
    case 500:
      return "Internal server error";
    default:
      return "Unexpected error";
  }
};
