import { useState } from "react";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { fetchAiProviders, aiGenerateData } from "../services/entity";
import { XEntity } from "../../types/xEntity";

export interface AiGenerateConfig {
    aiGenerateDialogHeader: string;
    aiGenerateRequirementPlaceholder: string;
    aiGenerateButtonText: string;
    aiGenerateModelLabel: string;
    cancelButtonText: string;
}

export function useAiGenerate(
    schema: XEntity, 
    getValues: () => any, 
    onGenerated: (generatedFields: any) => void,
    handleErrorOrSuccess: any, 
    CheckErrorStatus: any,
    pageConfig: AiGenerateConfig,
    visible: boolean,
    setVisible: (v: boolean) => void
) {

    const [loading, setLoading] = useState(false);
    const [models, setModels] = useState<string[]>([]);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);

    const [requirement, setRequirement] = useState('');

    const loadModels = async () => {
        const list = await fetchAiProviders();
        setModels(list);
        if (list.length > 0 && !selectedModel) {
            setSelectedModel(list[0]);
        }
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const currentData = getValues();
            const { error, data: resData } = await aiGenerateData(schema.name, requirement, currentData, selectedModel ?? undefined);

            await handleErrorOrSuccess(error, 'AI generation complete', () => {
                if (resData?.data) {
                    onGenerated(resData.data);
                }
                setVisible(false);
            });
        } finally {
            setLoading(false);
        }
    };

    const AiGenerateDialog = () => (
        <Dialog
            header={pageConfig.aiGenerateDialogHeader}
            visible={visible}
            style={{ width: '50vw' }}
            onHide={() => {
                setRequirement('');
                setVisible(false)
            }}
            onShow={loadModels}
        >
            <CheckErrorStatus />
            <div className="flex flex-column gap-2 mb-4">
                <label htmlFor="modelSelection" className="font-bold">{pageConfig.aiGenerateModelLabel}</label>
                <Dropdown
                    id="modelSelection"
                    value={selectedModel}
                    options={models}
                    onChange={(e) => setSelectedModel(e.value)}
                    placeholder="Select a model"
                    disabled={models.length === 0}
                />
            </div>
            <div className="flex flex-column gap-2 mb-4">
                <label htmlFor="requirement" className="font-bold">Requirement</label>
                <InputTextarea
                    id="requirement"
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    rows={5}
                    placeholder={pageConfig.aiGenerateRequirementPlaceholder}
                    autoResize
                />
            </div>
            <div className="flex justify-content-end gap-2">
                <Button
                    label={pageConfig.cancelButtonText}
                    icon="pi pi-times"
                    outlined
                    onClick={() => setVisible(false)}
                    disabled={loading}
                />
                <Button
                    label={pageConfig.aiGenerateButtonText}
                    icon="pi pi-sparkles"
                    onClick={handleGenerate}
                    loading={loading}
                />
            </div>
        </Dialog>
    );

    return { AiGenerateDialog };
}
