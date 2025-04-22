import React, { useState } from "react";
import {
    Layout,
    Menu,
    Typography,
    Button,
    theme,
    Dropdown,
    Space,
} from "antd";
import {
    DashboardOutlined,
    UserOutlined,
    AccountBookOutlined,
    ShoppingOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    UserSwitchOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { token } = theme.useToken();
    const { isLoggedIn, logout } = useAuth();

    const fullMenuItems = [
        {
            key: "/",
            icon: <DashboardOutlined />,
            label: "Dashboard",
        },
        {
            key: "/customers",
            icon: <UserOutlined />,
            label: "Customers",
        },
        {
            key: "/accounts",
            icon: <AccountBookOutlined />,
            label: "Accounts",
        },
        {
            key: "/products",
            icon: <ShoppingOutlined />,
            label: "Products",
        },
        {
            key: "/invoices",
            icon: <ShoppingOutlined />,
            label: "Invoices",
        },
        {
            key: "/vendors",
            icon: <ShoppingOutlined />,
            label: "Vendors",
        },
        {
            key: "/bills",
            icon: <ShoppingOutlined />,
            label: "Bills",
        },
    ];

    const menuItems = isLoggedIn
        ? fullMenuItems
        : fullMenuItems.filter((item) => item.key === "/");

    const userMenu = (
        <Menu
            items={[
                {
                    key: "profile",
                    icon: <UserSwitchOutlined />,
                    label: "Profile",
                },
                {
                    key: "logout",
                    icon: <LogoutOutlined />,
                    label: "Logout",
                    onClick: logout,
                },
            ]}
        />
    );

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Header
                style={{
                    position: "fixed",
                    width: "100%",
                    top: 0,
                    // zIndex: 1001,
                    padding: "0 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: token.colorBgContainer,
                    boxShadow: "0 1px 4px rgba(0,21,41,0.08)",
                }}
            >
                <div style={{ display: "flex", alignItems: "center" }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: "16px", marginRight: 16 }}
                    />
                    <Typography.Title level={4} style={{ margin: 0 }}>
                        QuickBooks Dashboard
                    </Typography.Title>
                </div>

                {isLoggedIn && (
                    <Dropdown overlay={userMenu} placement="bottomRight" arrow>
                        <Button type="text">
                            <Space>
                                Hi, User
                            </Space>
                        </Button>
                    </Dropdown>
                )}
            </Header>

            <Layout hasSider>
                <Sider
                    collapsible
                    collapsed={collapsed}
                    width={220}
                    style={{
                        overflow: "auto",
                        height: "100vh",
                        position: "fixed",
                        top: 64,
                        left: 0,
                        bottom: 0,
                        background: "#fff",
                        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.05)",
                        transition: "all 0.2s ease-in-out",
                    }}
                >
                    <Menu
                        mode="inline"
                        selectedKeys={[location.pathname]}
                        onClick={({ key }) => navigate(key)}
                        items={menuItems}
                        style={{ borderRight: 0, paddingTop: 16 }}
                    />
                </Sider>

                <Layout
                    style={{
                        marginLeft: collapsed ? 60 : 220,
                        marginTop: 64,
                        padding: "5px",
                        transition: "all 0.3s ease-in-out",
                        background: token.colorBgLayout,
                    }}
                >
                    <Content
                        style={{
                            padding: 24,
                            minHeight: 280,
                            background: token.colorBgContainer,
                            
                        }}
                    >
                        {children}
                    </Content>
                </Layout>
            </Layout>
        </Layout>
    );
};
