import { Card, Button, Space } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { ReactNode } from "react";

interface SyncCardProps {
  icon: ReactNode;
  title: string;
  loading: boolean;
  onClick: () => void;
}

const SyncCard = ({ icon, title, loading, onClick }: SyncCardProps) => {
  return (
    <Card
      style={{ height: "100%", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}
      bodyStyle={{ padding: "24px" }}
      title={
        <Space>
          {icon}
          <span>{title}</span>
        </Space>
      }
    >
      <Button
        type="primary"
        icon={<SyncOutlined />}
        onClick={onClick}
        loading={loading}
        size="large"
        block
      >
        Sync {title}
      </Button>
    </Card>
  );
};

export default SyncCard;
