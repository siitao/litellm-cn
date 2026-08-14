/**
 * Allow proxy admin to add other people to view global spend
 * Use this to avoid sharing master key with others
 */
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import {
  Button,
  Callout,
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import { Alert, Button as Button2, Form, Input, Modal, Space, Tabs, Typography } from "antd";
import React, { useEffect, useState } from "react";
import NewBadge from "@/components/common_components/NewBadge";
import { useBaseUrl } from "@/components/constants";
import NotificationsManager from "@/components/molecules/notifications_manager";
import { addAllowedIP, deleteAllowedIP, getAllowedIPs, getSSOSettings } from "@/components/networking";
import SCIMConfig from "@/components/SCIM";
import LoggingSettings from "@/components/Settings/AdminSettings/LoggingSettings/LoggingSettings";
import SSOSettings from "@/components/Settings/AdminSettings/SSOSettings/SSOSettings";
import UISettings from "@/components/Settings/AdminSettings/UISettings/UISettings";
import UserBannerSettings from "@/components/Settings/AdminSettings/UserBannerSettings/UserBannerSettings";
import HashicorpVault from "@/components/Settings/AdminSettings/HashicorpVault/HashicorpVault";
import PluginSettings from "@/components/Settings/AdminSettings/PluginSettings/PluginSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import SSOModals from "@/components/SSOModals";
import UIAccessControlForm from "@/components/UIAccessControlForm";

const { Title, Paragraph, Text } = Typography;

interface AdminPanelProps {
  proxySettings?: any;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ proxySettings }) => {
  const { t } = useLanguage();
  const { premiumUser, accessToken, userId: userID } = useAuthorized();
  const [form] = Form.useForm();
  const [isAddSSOModalVisible, setIsAddSSOModalVisible] = useState(false);
  const [isInstructionsModalVisible, setIsInstructionsModalVisible] = useState(false);
  const [isAllowedIPModalVisible, setIsAllowedIPModalVisible] = useState(false);
  const [isAddIPModalVisible, setIsAddIPModalVisible] = useState(false);
  const [isDeleteIPModalVisible, setIsDeleteIPModalVisible] = useState(false);
  const [isUIAccessControlModalVisible, setIsUIAccessControlModalVisible] = useState(false);
  const [allowedIPs, setAllowedIPs] = useState<string[]>([]);
  const [ipToDelete, setIPToDelete] = useState<string | null>(null);
  const [ssoConfigured, setSsoConfigured] = useState<boolean>(false);

  const baseUrl = useBaseUrl();
  const all_ip_address_allowed = t("admin_panel.all_ips_allowed");

  let nonSssoUrl = baseUrl;
  nonSssoUrl += "/fallback/login";

  const checkSSOConfiguration = async () => {
    if (accessToken) {
      try {
        const ssoData = await getSSOSettings(accessToken);

        if (ssoData && ssoData.values) {
          const hasGoogleSSO = ssoData.values.google_client_id && ssoData.values.google_client_secret;
          const hasMicrosoftSSO = ssoData.values.microsoft_client_id && ssoData.values.microsoft_client_secret;
          const hasGenericSSO = ssoData.values.generic_client_id && ssoData.values.generic_client_secret;

          setSsoConfigured(hasGoogleSSO || hasMicrosoftSSO || hasGenericSSO);
        } else {
          setSsoConfigured(false);
        }
      } catch (error) {
        console.error("Error checking SSO configuration:", error);
        setSsoConfigured(false);
      }
    }
  };

  const handleShowAllowedIPs = async () => {
    try {
      if (premiumUser !== true) {
        NotificationsManager.fromBackend(
          "This feature is only available for premium users. Please upgrade your account.",
        );
        return;
      }
      if (accessToken) {
        const data = await getAllowedIPs(accessToken);
        setAllowedIPs(data && data.length > 0 ? data : [all_ip_address_allowed]);
      } else {
        setAllowedIPs([all_ip_address_allowed]);
      }
    } catch (error) {
      console.error("Error fetching allowed IPs:", error);
      NotificationsManager.fromBackend(`Failed to fetch allowed IPs ${error}`);
      setAllowedIPs([all_ip_address_allowed]);
    } finally {
      if (premiumUser === true) {
        setIsAllowedIPModalVisible(true);
      }
    }
  };

  const handleAddIP = async (values: { ip: string }) => {
    try {
      if (accessToken) {
        await addAllowedIP(accessToken, values.ip);
        // Fetch the updated list of IPs
        const updatedIPs = await getAllowedIPs(accessToken);
        setAllowedIPs(updatedIPs);
        NotificationsManager.success("IP address added successfully");
      }
    } catch (error) {
      console.error("Error adding IP:", error);
      NotificationsManager.fromBackend(`Failed to add IP address ${error}`);
    } finally {
      setIsAddIPModalVisible(false);
    }
  };

  const handleDeleteIP = async (ip: string) => {
    setIPToDelete(ip);
    setIsDeleteIPModalVisible(true);
  };

  const confirmDeleteIP = async () => {
    if (ipToDelete && accessToken) {
      try {
        await deleteAllowedIP(accessToken, ipToDelete);
        // Fetch the updated list of IPs
        const updatedIPs = await getAllowedIPs(accessToken);
        setAllowedIPs(updatedIPs.length > 0 ? updatedIPs : [all_ip_address_allowed]);
        NotificationsManager.success("IP address deleted successfully");
      } catch (error) {
        console.error("Error deleting IP:", error);
        NotificationsManager.fromBackend(`Failed to delete IP address ${error}`);
      } finally {
        setIsDeleteIPModalVisible(false);
        setIPToDelete(null);
      }
    }
  };

  const handleAddSSOOk = () => {
    setIsAddSSOModalVisible(false);
    form.resetFields();
    if (accessToken && premiumUser) {
      checkSSOConfiguration();
    }
  };

  const handleAddSSOCancel = () => {
    setIsAddSSOModalVisible(false);
    form.resetFields();
  };

  const handleShowInstructions = (formValues: Record<string, any>) => {
    setIsAddSSOModalVisible(false);
    setIsInstructionsModalVisible(true);
  };

  const handleInstructionsOk = () => {
    setIsInstructionsModalVisible(false);
    if (accessToken && premiumUser) {
      checkSSOConfiguration();
    }
  };

  const handleInstructionsCancel = () => {
    setIsInstructionsModalVisible(false);
    if (accessToken && premiumUser) {
      checkSSOConfiguration();
    }
  };

  useEffect(() => {
    checkSSOConfiguration();
  }, [accessToken, premiumUser, checkSSOConfiguration]);

  const handleUIAccessControlOk = () => {
    setIsUIAccessControlModalVisible(false);
  };

  const handleUIAccessControlCancel = () => {
    setIsUIAccessControlModalVisible(false);
  };

  const tabItems = [
    {
      key: "sso-settings",
      label: t("admin_panel.tab_sso"),
      children: <SSOSettings />,
    },
    {
      key: "security-settings",
      label: t("admin_panel.tab_security"),
      children: (
        <>
          <Card>
            <Title level={4}> {t("admin_panel.security_section")}</Title>
            <Alert
              message="SSO Configuration Deprecated"
              description="Editing SSO Settings on this page is deprecated and will be removed in a future version. Please use the SSO Settings tab for SSO configuration."
              type="warning"
              showIcon
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginTop: "1rem",
                marginLeft: "0.5rem",
              }}
            >
              <div>
                <Button style={{ width: "150px" }} onClick={() => setIsAddSSOModalVisible(true)}>
                  {ssoConfigured ? t("admin_panel.edit_sso") : t("admin_panel.add_sso")}
                </Button>
              </div>
              <div>
                <Button style={{ width: "150px" }} onClick={handleShowAllowedIPs}>
                  {t("admin_panel.allowed_ips")}
                </Button>
              </div>
              <div>
                <Button
                  style={{ width: "150px" }}
                  onClick={() =>
                    premiumUser === true
                      ? setIsUIAccessControlModalVisible(true)
                      : NotificationsManager.fromBackend("Only premium users can configure UI access control")
                  }
                >
                  UI Access Control
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex justify-start mb-4">
            <SSOModals
              isAddSSOModalVisible={isAddSSOModalVisible}
              isInstructionsModalVisible={isInstructionsModalVisible}
              handleAddSSOOk={handleAddSSOOk}
              handleAddSSOCancel={handleAddSSOCancel}
              handleShowInstructions={handleShowInstructions}
              handleInstructionsOk={handleInstructionsOk}
              handleInstructionsCancel={handleInstructionsCancel}
              form={form}
              accessToken={accessToken}
              ssoConfigured={ssoConfigured}
            />
            <Modal
              title={t("admin_panel.manage_allowed_ips")}
              width={800}
              open={isAllowedIPModalVisible}
              onCancel={() => setIsAllowedIPModalVisible(false)}
              footer={[
                <Button className="mx-1" key="add" onClick={() => setIsAddIPModalVisible(true)}>
                  {t("admin_panel.add_ip")}
                </Button>,
                <Button key="close" onClick={() => setIsAllowedIPModalVisible(false)}>
                  {t("common.close")}
                </Button>,
              ]}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>{t("admin_panel.col_ip_address")}</TableHeaderCell>
                    <TableHeaderCell className="text-right">Action</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allowedIPs.map((ip, index) => (
                    <TableRow key={index}>
                      <TableCell>{ip}</TableCell>
                      <TableCell className="text-right">
                        {ip !== all_ip_address_allowed && (
                          <Button onClick={() => handleDeleteIP(ip)} color="red" size="xs">
                            Delete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Modal>

            <Modal
              title={t("admin_panel.add_ip_address")}
              open={isAddIPModalVisible}
              onCancel={() => setIsAddIPModalVisible(false)}
              footer={null}
            >
              <Form onFinish={handleAddIP}>
                <Form.Item name="ip" rules={[{ required: true, message: t("admin_panel.enter_ip") }]}>
                  <Input placeholder={t("admin_panel.enter_ip_placeholder")} />
                </Form.Item>
                <Form.Item>
                  <Button2 htmlType="submit">{t("admin_panel.add_ip")}</Button2>
                </Form.Item>
              </Form>
            </Modal>

            <Modal
              title={t("admin_panel.confirm_delete")}
              open={isDeleteIPModalVisible}
              onCancel={() => setIsDeleteIPModalVisible(false)}
              onOk={confirmDeleteIP}
              footer={[
                <Button className="mx-1" key="delete" onClick={() => confirmDeleteIP()}>
                  Yes
                </Button>,
                <Button key="close" onClick={() => setIsDeleteIPModalVisible(false)}>
                  {t("common.close")}
                </Button>,
              ]}
            >
              <Text>{t("admin_panel.delete_ip_confirm").replace("{ip}", ipToDelete ?? "")}</Text>
            </Modal>

            {/* UI Access Control Modal */}
            <Modal
              title={t("admin_panel.ui_access_control_settings")}
              open={isUIAccessControlModalVisible}
              width={600}
              footer={null}
              onOk={handleUIAccessControlOk}
              onCancel={handleUIAccessControlCancel}
            >
              <UIAccessControlForm
                accessToken={accessToken}
                onSuccess={() => {
                  handleUIAccessControlOk();
                  NotificationsManager.success("UI Access Control settings updated successfully");
                }}
              />
            </Modal>
          </div>
          <Callout title={t("admin_panel.login_without_sso")} color="teal">
            If you need to login without sso, you can access{" "}
            <a href={nonSssoUrl} target="_blank" rel="noopener noreferrer">
              <b>{nonSssoUrl}</b>{" "}
            </a>
          </Callout>
        </>
      ),
    },
    {
      key: "scim",
      label: t("admin_panel.tab_scim"),
      children: <SCIMConfig accessToken={accessToken} userID={userID} proxySettings={proxySettings} />,
    },
    {
      key: "ui-settings",
      label: (
        <Space>
          <Text>
            {t("admin_panel.tab_ui_settings")} <NewBadge />
          </Text>
        </Space>
      ),
      children: (
        <div className="flex flex-col gap-4">
          <UISettings />
          <UserBannerSettings />
        </div>
      ),
    },
    {
      key: "logging-settings",
      label: t("admin_panel.tab_logging"),
      children: <LoggingSettings />,
    },
    {
      key: "hashicorp-vault",
      label: "Hashicorp Vault",
      children: <HashicorpVault />,
    },
    {
      key: "plugins",
      label: "Plugins",
      children: <PluginSettings />,
    },
  ];

  return (
    <div className="w-full m-2 mt-2 p-8">
      <Title level={4}>{t("admin_panel.heading")} </Title>
      <Paragraph>{t("admin_panel.note")}</Paragraph>
      <Tabs items={tabItems} />
    </div>
  );
};

export default AdminPanel;
