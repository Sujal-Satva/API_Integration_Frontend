import {
  Alert,
  Button,
  message,
  Space,
  Spin,
  Typography,
  Row,
  Col,
  Card,
  Tag
} from "antd";
import {
  LinkOutlined,
  CheckCircleOutlined,
  DisconnectOutlined
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";


const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { connectedAccounts, updateConnection } = useAuth();
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const realmId = searchParams.get("realmId");
    const sessionState = searchParams.get("session_state");
    const scope = searchParams.get("scope");

    if (code && state && realmId) {
      fetchQuickBooksAccessToken(code, state, realmId);
    }
    else if (code && sessionState && scope) {
      fetchXeroAccessToken(code, sessionState, scope);
    }
  }, [searchParams]);
  const fetchQuickBooksAccessToken = async (code: string, state: string, realmId: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/qbo-callback`, {
        params: { code, state, realmId },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const connectionId = response.data?.data?.realmId || null;
      message.success("Successfully connected to QuickBooks!");
      updateConnection("quickbooks", true, connectionId);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      message.error("Failed to connect to QuickBooks");
    } finally {
      setLoading(false);
    }
  };

  const fetchXeroAccessToken = async (code: string, sessionState: string, scope: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/xero-callback`, {
        params: { code, sessionState, scope },
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      const connectionId = response.data?.data?.tenantId || null;
      message.success("Successfully connected to Xero!");
      updateConnection("xero", true, connectionId);
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      message.error("Failed to connect to Xero");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectQuickBooks = () => {
    window.location.href = `${API_URL}/qbo-login`;
  };

  const handleConnectXero = () => {
    window.location.href = `${API_URL}/xero-login`;
  };

  const handleDisconnect = async (service: string, id: string) => {
    try {
      const response = await axios.get(`${API_URL}/disconnect-connection?id=${id}`,);
      message.success(`Disconnected from service ${service}`);
      if (service.toLowerCase() === "xero" || service.toLowerCase() === "quickbooks") {
        updateConnection(service.toLowerCase() as "xero" | "quickbooks", false, null);
      } else {
        message.error(`Invalid service: ${service}`);
      }
    } catch (err) {
      message.error(`Failed to disconnect from ${id}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", height: "calc(100vh - 64px)", justifyContent: "center", alignItems: "center" }}>
        <Spin size="large" tip="Connecting to accounting system..." />
      </div>
    );
  }

  const hasConnectedAccount = connectedAccounts.quickbooks || connectedAccounts.xero;

  return (
    <div style={{ padding: 24, minHeight: "calc(100vh - 64px)" }}>
      {!hasConnectedAccount ? (
        <div style={{ maxWidth: 750, margin: "0 auto" }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Typography.Title level={3} style={{ textAlign: "center" }}>
              QuickBooks & Xero Integration
            </Typography.Title>

            <Alert
              message="Connect Your Accounting Account"
              description="Link your QuickBooks or Xero account to access and download your business data."
              type="info"
              showIcon
            />

            <div style={{ textAlign: "center" }}>
              <Button
                type="primary"
                icon={<LinkOutlined />}
                onClick={handleConnectQuickBooks}
                style={{
                  backgroundColor: "#00a700",
                  borderColor: "#00a700",
                  width: 260,
                  height: 45,
                  fontSize: 16,
                  marginBottom: 10,
                }}
              >
                Connect to QuickBooks
              </Button>
              <br />
              <Button
                type="primary"
                icon={<LinkOutlined />}
                onClick={handleConnectXero}
                style={{
                  backgroundColor: "#1A73E8",
                  borderColor: "#1A73E8",
                  width: 260,
                  height: 45,
                  fontSize: 16,
                }}
              >
                Connect to Xero
              </Button>
            </div>
          </Space>
        </div>
      ) : (
        <div>
          <Typography.Title level={3}>Connected Accounting Systems</Typography.Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Typography.Title level={4}>QuickBooks</Typography.Title>
                    {connectedAccounts.quickbooks ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>Connected</Tag>
                    ) : (
                      <Tag color="gray">Not Connected</Tag>
                    )}
                  </div>
                  {connectedAccounts.quickbooks ? (
                    <Button
                      icon={<DisconnectOutlined />}
                      danger
                      onClick={() => {
                        if (connectedAccounts.quickbooksConnectionId) {
                          handleDisconnect("Quickbooks", connectedAccounts.quickbooksConnectionId);
                        } else {
                          message.error("Connection ID for QuickBooks is missing.");
                        }
                      }}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<LinkOutlined />}
                      onClick={handleConnectQuickBooks}
                      style={{
                        backgroundColor: "#00a700",
                        borderColor: "#00a700",
                      }}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <Typography.Title level={4}>Xero</Typography.Title>
                    {connectedAccounts.xero ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>Connected</Tag>
                    ) : (
                      <Tag color="gray">Not Connected</Tag>
                    )}
                  </div>
                  {connectedAccounts.xero ? (
                    <Button
                      icon={<DisconnectOutlined />}
                      danger
                      onClick={() => {
                        if (connectedAccounts.xeroConnectionId) {
                          handleDisconnect("Xero", connectedAccounts.xeroConnectionId);
                        } else {
                          message.error("Connection ID for Xero is missing.");
                        }
                      }} // Use the correct connection ID
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<LinkOutlined />}
                      onClick={handleConnectXero}
                      style={{
                        backgroundColor: "#1A73E8",
                        borderColor: "#1A73E8",
                      }}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
};

export default Dashboard;