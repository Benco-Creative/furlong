"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { IWorkspace, TUserApplication } from "@plane/types";
import { Button, CustomMenu, setToast, TOAST_TYPE } from "@plane/ui";
import { getFileURL } from "@/helpers/file.helper";
import { useWorkspace } from "@/hooks/store";
import { ApplicationService, OAuthService, TConsentParams } from "@/plane-web/services/marketplace";
import ConnectSvg from "@/public/marketplace/connect.svg";
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";
import { AuthService } from "@/services/auth.service";
import { ApplicationPermissionText, userLevelPermissions, workspaceLevelPermissions } from "../applications/installation/details";

type TAppConsentProps = {
    application: Partial<TUserApplication>;
    consentParams: TConsentParams;
}

const oauthService = new OAuthService();
const applicationService = new ApplicationService();
const authService = new AuthService();

export const AppConsent = observer(({ application, consentParams }: TAppConsentProps) => {
    const { t } = useTranslation();
    const router = useRouter();

    const { workspaces } = useWorkspace();
    const workspacesList = Object.values(workspaces ?? {});

    const [selectedWorkspace, setSelectedWorkspace] = useState<IWorkspace>(workspacesList[0]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);

    const handleWorkspaceChange = (workspace: IWorkspace) => {
        setSelectedWorkspace(workspace);
    }


    const handleAccept = async () => {
        try {
            setIsSubmitting(true);
            if (!selectedWorkspace || !application?.id || !csrfToken) return;
            const { redirect_uri } = consentParams;

            // create the installation
            const installation = await applicationService.installApplication(selectedWorkspace.slug, application?.id);

            // post to oauth with updated redirect uri
            const redirectUri = `${redirect_uri}?app_installation_id=${installation?.id}`;
            const updatedConsentParams = { ...consentParams, redirect_uri: redirectUri };
            await oauthService.authorizeApplication(updatedConsentParams, csrfToken);
            return;
        } catch (error) {
            console.error(error);
            setToast({
                type: TOAST_TYPE.ERROR,
                title: "Error",
                message: "Failed to authorize application",
            });
            setIsSubmitting(false);
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleCancel = () => {
        router.back();
    }


    useEffect(() => {
        if (csrfToken === undefined)
          authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
      }, [csrfToken]);

    return <div className="flex flex-col gap-y-4 justify-center items-center">
        <div className="flex items-center space-x-4">
            <Image src={getFileURL(application?.logo_url ?? "") ?? ""} alt="Plane logo" className="w-10 h-10" />
            <Image src={ConnectSvg} alt="Connect" className="w-5 h-5" />
            <Image src={PlaneLogo} alt="Plane logo" className="w-10 h-10" />
        </div>
        <h1>{t("workspace_settings.settings.applications.app_consent_title", { app: application.name })}</h1>

        <div className="flex flex-col gap-y-4 border border-border-100 rounded-lg p-4 bg-custom-background-90">
            <div className="text-sm text-custom-text-300 font-medium">
                {t("workspace_settings.settings.applications.choose_workspace_to_connect_app_with")}
            </div>
            <CustomMenu
                maxHeight={"md"}
                className="flex flex-grow justify-center text-sm text-custom-text-200"
                placement="bottom-start"
                customButton={
                    <div className="flex flex-grow gap-1.5 justify-between items-center text-sm text-custom-text-200">
                        <WorkspaceDetails workspace={selectedWorkspace} />
                        <ChevronDown className="ml-auto h-4 w-4 text-custom-text-200" />
                    </div>
                }
                customButtonClassName="flex flex-grow border border-custom-border-200 rounded-md p-2 bg-custom-background-100 text-custom-text-200 text-sm w-40"
                closeOnSelect
            >
                {workspacesList.map((workspace, index) => (
                    <CustomMenu.MenuItem
                        key={workspace.id}
                        onClick={() => {
                            handleWorkspaceChange(workspace);
                        }}
                        className="flex items-center gap-2"
                    >
                        <WorkspaceDetails workspace={workspace} />
                    </CustomMenu.MenuItem>
                ))}
            </CustomMenu>
            <div className="flex flex-col gap-y-2">
                <div className="text-sm text-custom-text-200 font-medium">{t("workspace_settings.settings.applications.app_consent_workspace_permissions_title", { app: application.name })}</div>
                <div className="flex flex-col space-y-2 py-2 border-b border-custom-border-200">
                    {workspaceLevelPermissions.map((permission) => (
                        <ApplicationPermissionText key={permission.key} permission={permission} />
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-y-2">
                <div className="text-sm text-custom-text-200 font-medium">{t("workspace_settings.settings.applications.user_permissions")}</div>
                <div className="text-sm text-custom-text-300">{t("workspace_settings.settings.applications.app_consent_user_permissions_title", { app: application.name })}</div>
            </div>
            <div className="flex flex-col space-y-2">
                {userLevelPermissions.map((permission) => (
                    <ApplicationPermissionText key={permission.key} permission={permission} />
                ))}
            </div>
            <div className="flex flex-col gap-y-1">
                <div className="text-sm text-custom-text-300 font-medium">{t("workspace_settings.settings.applications.app_consent_accept_title")}</div>
                <ul className="list-disc list-inside text-custom-text-300 text-sm">
                    <li>{t("workspace_settings.settings.applications.app_consent_accept_1")}</li>
                    <li>{t("workspace_settings.settings.applications.app_consent_accept_2", { app: application.name })}</li>
                </ul>
            </div>
        </div>
        <div className="flex flex-row justify-end items-center gap-x-2 ml-auto">
            <Button variant="primary" size="sm" onClick={handleAccept} disabled={isSubmitting}>
                {isSubmitting ? t("workspace_settings.settings.applications.accepting") : t("workspace_settings.settings.applications.accept")}
            </Button>
            <Button variant="neutral-primary" size="sm" onClick={handleCancel} disabled={isSubmitting}>
                {t("common.cancel")}
            </Button>
        </div>
    </div>;
});


const WorkspaceDetails = (props: { workspace: IWorkspace }) => {
    const { workspace } = props;
    return (
        <>
            <span
                className={`relative flex h-5 w-5 flex-shrink-0 items-center justify-center p-2 text-xs uppercase ${!workspace?.logo_url && "rounded bg-custom-primary-500 text-white"}`}
            >
                {workspace?.logo_url && workspace.logo_url !== "" ? (
                    <img
                        src={getFileURL(workspace.logo_url)}
                        className="absolute left-0 top-0 h-full w-full rounded object-cover"
                        alt="Workspace Logo"
                    />
                ) : (
                    (workspace?.name?.[0] ?? "...")
                )}
            </span>
            <span className="text-custom-text-300">{workspace?.name}</span>
        </>
    )
}