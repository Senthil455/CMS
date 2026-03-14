import { useEffect } from "react";
import { Button } from "primereact/button";
import { ButtonGroup } from "primereact/buttongroup";
import {GlobalStateKeys, useGlobalState, useLanguage} from "../../globalState";
import { NewDataItemPageConfig, userNewDataItemPage, XEntity } from "@cms/sdk";
import { getDefaultComponentConfig } from "../../getDefaultComponentConfig";
import { cnComponentConfig } from "../../types/cnComponentConfig";

// Centralized language configuration
const languageConfig = {
    en: {
        save: "Save",
        back: "Back",
        aiGenerate: "AI Generate"
    },
    cn: {
        save: "保存",
        back: "返回",
        aiGenerate: "AI 生成"
    }
};

// Chinese-specific page configuration
const cnPageConfig: NewDataItemPageConfig = {
    saveSuccess: (label: string | undefined) => `保存 ${label} 成功`,
    aiGenerateDialogHeader: "AI 生成内容",
    aiGenerateRequirementPlaceholder: "您想要生成什么样的数据？",
    aiGenerateButtonText: "智能生成",
    aiGenerateModelLabel: "模型",
    cancelButtonText: "取消",
};

export function NewDataItemPage({ schema, baseRouter }: { schema: XEntity; baseRouter: string }) {
    const lan = useLanguage();
    const langTexts = languageConfig[lan === 'en' ? 'en' : 'cn'];

    const { handleGoBack, handleShowAiGenerate, formId, NewDataItemPageMain } = userNewDataItemPage(
        lan === 'en' ? getDefaultComponentConfig() : cnComponentConfig,
        schema,
        baseRouter,
        lan === 'en' ? undefined : cnPageConfig
    );
    const [_, setHeader] = useGlobalState<string>( GlobalStateKeys.Header, '');

    useEffect(() => {
        setHeader(`New ${schema.displayName}`);
    }, [schema.displayName, setHeader]);
    return (
        <>
            <br />
            <ButtonGroup>
                <Button
                    label={`${langTexts.save} ${schema.displayName}`}
                    type="submit"
                    form={formId}
                    icon="pi pi-check"
                />
                <Button
                    type="button"
                    label={langTexts.back}
                    onClick={handleGoBack}
                />
            </ButtonGroup>
            <span>&nbsp;</span>
            <ButtonGroup>
                <Button
                    type="button"
                    label={langTexts.aiGenerate}
                    icon="pi pi-sparkles"
                    severity="info"
                    outlined
                    onClick={handleShowAiGenerate}
                />
            </ButtonGroup>
            <br />
            <br />
            <NewDataItemPageMain />
        </>
    );
}