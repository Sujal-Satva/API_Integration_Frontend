import {
  Alert,
  Button,
  message,
  Space,
  Spin,
  Typography,
  Row,
  Col,
} from "antd";
import {
  LinkOutlined,
  TeamOutlined,
  BankOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  ShopOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import SyncCard from "../components/SyncCard";

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { isLoggedIn, login } = useAuth();

  const [downloadStates, setDownloadStates] = useState<Record<string, boolean>>({
    customer: false,
    account: false,
    product: false,
    invoice: false,
    vendor: false,
    bills: false,
  });

  const syncOptions = [
    { key: "customer", title: "Customers", icon: <TeamOutlined /> },
    { key: "account", title: "Accounts", icon: <BankOutlined /> },
    { key: "product", title: "Products", icon: <ShoppingOutlined /> },
    { key: "invoice", title: "Invoices", icon: <FileTextOutlined /> },
    { key: "vendor", title: "Vendors", icon: <ShopOutlined /> },
    { key: "bills", title: "Bills", icon: <CreditCardOutlined /> },
  ];

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const realmId = searchParams.get("realmId");
    const token = localStorage.getItem("qb_access_token");

    if (token) return;
    if (code && state && realmId) fetchAccessToken(code, state, realmId);
  }, [searchParams]);

  const fetchAccessToken = async (
    code: string,
    state: string,
    realmId: string
  ) => {
    setLoading(true);
    try {
      const res = await axios.get(`https://localhost:7217/api/Auth/callback`, {
        params: { code, state, realmId },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      localStorage.setItem("qb_access_token", res.data?.accessToken ?? "");
      localStorage.setItem("qb_refresh_token", res.data?.refreshToken ?? "");
      localStorage.setItem("qb_realm_id", res.data?.realmId ?? "");

      message.success("Successfully connected to QuickBooks!");
      login(); // update context
    } catch (err) {
      message.error("Failed to connect to QuickBooks");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    window.location.href = `${API_URL}/api/Auth/login`;
  };

  const handleSync = async (key: string) => {
    setDownloadStates((prev) => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem("qb_access_token");
      const realmId = localStorage.getItem("qb_realm_id");
      const response = await axios.get(`${API_URL}/api/${key.charAt(0).toUpperCase() + key.slice(1)}/fetch?realmId=${realmId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status.error == null)
        message.success(`Synced ${key}`);
    } catch (err) {
      message.error(`Failed to sync ${key}`);
    } finally {
      setDownloadStates((prev) => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "calc(100vh - 64px)", justifyContent: "center", alignItems: "center" }}>
        <Spin size="large" tip="Connecting to QuickBooks..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, minHeight: "calc(100vh - 64px)" }}>
      {!isLoggedIn ? (
        <div style={{ maxWidth: 750, margin: "0 auto" }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Typography.Title level={3} style={{ textAlign: "center" }}>
              QuickBooks Integration
            </Typography.Title>

            <Alert
              message="Connect Your QuickBooks Account"
              description="Link your QuickBooks account to access and download your business data."
              type="info"
              showIcon
            />

            <div style={{ textAlign: "center" }}>
              <Button
                type="primary"
                icon={<LinkOutlined />}
                onClick={handleConnect}
                style={{
                  backgroundColor: "#00a700",
                  borderColor: "#00a700",
                  width: 260,
                  height: 45,
                  fontSize: 16,
                }}
              >
                Connect to QuickBooks
              </Button>
            </div>
          </Space>
        </div>
      ) : (
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            message="QuickBooks Connected"
            description="Your QuickBooks account is connected. You can now download your business data."
            type="success"
            showIcon
          />
          <Row gutter={[24, 24]}>
            {syncOptions.map(({ key, title, icon }) => (
              <Col xs={24} sm={12} md={8} lg={6} key={key}>
                <SyncCard
                  title={title}
                  icon={icon}
                  loading={downloadStates[key]}
                  onClick={() => handleSync(key)}
                />
              </Col>
            ))}
          </Row>
        </Space>
      )}
    </div>
  );
};

export default Dashboard;
