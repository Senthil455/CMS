import {addItem, useItemData} from "../services/entity";
import {useCheckError} from "../../hooks/useCheckError";
import {DisplayType, XEntity} from "../../types/xEntity";
import {getFileUploadURL, useGetCmsAssetsUrl} from "../services/asset";
import {createInput } from "../containers/createInput";
import {getInputAttrs} from "../../types/attrUtils";
import {useForm} from "react-hook-form";
import {ArrayToObject} from "../../types/formatter";
import {CmsComponentConfig} from "../cmsComponentConfig";
import {useNavigate} from "react-router-dom";
import {useState} from "react";
import {GeneralComponentConfig} from "../../ComponentConfig";
import {useAiGenerate} from "../hooks/useAiGenerate";

export interface NewDataItemPageConfig {
    saveSuccess: (label?: string) => string; // Success message for saving
    aiGenerateDialogHeader: string,
    aiGenerateRequirementPlaceholder: string,
    aiGenerateButtonText: string,
    aiGenerateModelLabel: string,
    cancelButtonText: string,
}

export function getDefaultNewDataItemPageConfig(): NewDataItemPageConfig{
    return {
        saveSuccess: (label?: string) => `Save${label ? ` [${label}]` : ''} Succeed`,
        aiGenerateDialogHeader: "AI Generate Content",
        aiGenerateRequirementPlaceholder: "What kind of data do you want to generate?",
        aiGenerateButtonText: "Generate",
        aiGenerateModelLabel: "Model",
        cancelButtonText: "Cancel",
    };
}

export function userNewDataItemPage(
    componentConfig: CmsComponentConfig & GeneralComponentConfig,
    schema: XEntity,
    baseRouter: string,
    pageConfig: NewDataItemPageConfig = getDefaultNewDataItemPageConfig(),
) {
    const formId = "newDataItemForm" + schema.name;
    const {register, handleSubmit, control, setValue, getValues} = useForm()
    const navigate = useNavigate();

    const [visible, setVisible] = useState(false);
    const handleShowAiGenerate = () => {
        setVisible(true);
    };

    function handleGoBack() {
        const refUrl = new URLSearchParams(location.search).get("ref");
        navigate(refUrl??`${baseRouter}/${schema.name}`);
    }

    function NewDataItemPageMain() {
        // Entrance and data
        const id = new URLSearchParams(location.search).get("sourceId");
        const {data} = useItemData(schema.name, id);

        const getFullAssetsURL = useGetCmsAssetsUrl();
        const uploadUrl = getFileUploadURL();
        const {handleErrorOrSuccess, CheckErrorStatus} = useCheckError(componentConfig);

        const inputAttrs = getInputAttrs(schema.attributes);
        const { AiGenerateDialog } = useAiGenerate(
            schema, 
            getValues, 
            (generatedFields) => {
                Object.keys(generatedFields).forEach(key => {
                    if (generatedFields[key] !== undefined && generatedFields[key] !== null) {
                        setValue(key, generatedFields[key], {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true
                        });
                    }
                });
            },
            handleErrorOrSuccess, 
            CheckErrorStatus,
            pageConfig,
            visible,
            setVisible
        );

        const handleSaveData = async (formData: any) => {
            schema.attributes.filter(x => x.displayType === DisplayType.Dictionary).forEach(a => {
                formData[a.field] = ArrayToObject(formData[a.field]);
            });

            const {data: savedData, error} = await addItem(schema.name, formData);
            await handleErrorOrSuccess(error, pageConfig.saveSuccess(formData[schema.labelAttributeName]), () => {
                window.location.href = `${baseRouter}/${schema.name}/${savedData[schema.primaryKey]}`;
            });
        };

        return (
            <>
                <CheckErrorStatus/>
                {
                    (!id || data) && <form onSubmit={handleSubmit(handleSaveData)} id={formId}>
                    <div className="formgrid grid">
                        {
                            inputAttrs.map((column: any) => createInput({
                                data: data??{},
                                column,
                                register,
                                control,
                                id,
                                uploadUrl,
                                getFullAssetsURL,
                                fullRowClassName:'field col-12',
                                partialRowClassName:'field col-12 md:col-4'
                            }, componentConfig))
                        }
                    </div>
                </form>
                }
                {AiGenerateDialog()}
            </>
        );
    }

    return {handleGoBack, handleShowAiGenerate, formId, NewDataItemPageMain};
}