import React, { useEffect, useState } from 'react';
import { Drawer, Form, Select, Button } from 'antd';
import QuickBooksForm from './QuickBooksBillForm';
import XeroForm from './XeroBillForm';
import { Invoice } from '../interfaces';

const { Option } = Select;

interface BillCommonFormProps {
    visible: boolean;
    onClose: () => void;
    platform?: string;
    bill: Invoice;
    isEditing: boolean;
}

const BillCommonForm: React.FC<BillCommonFormProps> = ({ visible, onClose ,fetchData}) => {
    const [platform, setPlatform] = useState<string | null>(null);
    const [form] = Form.useForm();

    
    const handlePlatformChange = (value: string) => {
        setPlatform(value);
        form.resetFields(['vendorName', 'account', 'contactName', 'reference']);
    };

    const handleSubmit = (values: any) => {
        onClose();
    };
    return (
        <Drawer
            title="Create Bill"
            width={920}
            onClose={onClose}
            visible={visible}
            destroyOnClose
        >
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                    label="Platform"
                    name="platform"
                    rules={[{ required: true, message: 'Please select a platform' }]}
                >
                    <Select placeholder="Select platform" onChange={handlePlatformChange}>
                        <Option value="QuickBooks">QuickBooks</Option>
                        <Option value="Xero">Xero</Option>
                    </Select>
                </Form.Item>

                {platform === 'QuickBooks' && <QuickBooksForm visible={visible} onClose={onClose} fetchData={fetchData}/>}
                {platform === 'Xero' && <XeroForm visible={visible} onClose={onClose} fetchData={fetchData}/>}
            </Form>
        </Drawer>
    );
};

export default BillCommonForm;
