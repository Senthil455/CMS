import { SelectButton, SelectButtonChangeEvent } from "primereact/selectbutton";
import { GlobalStateKeys, useGlobalState, useLanguage } from "../../globalState";
import {
    AssetListPageConfig,
    useAssetListPage
} from "@cms/sdk";
import { XEntity } from "@cms/sdk";
import { getDefaultComponentConfig } from "../../getDefaultComponentConfig";
import { cnComponentConfig } from "../../types/cnComponentConfig";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { useState, useRef } from "react";
import { ChunkUpload } from "./components/ChunkUpload";
import { downloadVideo } from "@cms/sdk";
import { Toast } from "primereact/toast";
import { InputText } from "primereact/inputtext";
import { ProgressSpinner } from "primereact/progressspinner";

const cnPageConfig: AssetListPageConfig = {
    deleteConfirm(label: string | undefined): string {
        return `您确认删除 ${label} 吗？`;
    },
    deleteConfirmHeader: "确认",
    deleteSuccess(_: string | undefined): string {
        return "删除成功";
    }, displayModeLabels: { gallery: "缩略图", list: "列表" }
}

const languageConfig = {
    en: {
        header: 'Asset List',
        chunkedUpload: 'Upload Large File',
        downloadVideo: 'Download Video',
        videoUrlLabel: 'Video URL',
        download: 'Download',
        downloading: 'Downloading...',
        invalidUrl: 'Invalid URL',
        clipboardConfirm: 'Found link in clipboard, download it?',
    },
    cn: {
        header: '资料列表',
        chunkedUpload: '上传大文件',
        downloadVideo: '下载视频',
        videoUrlLabel: '视频链接',
        download: '下载',
        downloading: '下载中...',
        invalidUrl: '无效的链接',
        clipboardConfirm: '在剪贴板中发现链接，是否下载？',
    }
}

export function AssetListPage({ schema, baseRouter }: { schema: XEntity, baseRouter: string }) {
    const lan = useLanguage();
    const labels = languageConfig[lan];

    const { displayMode, displayModeOptions, setDisplayMode, AssetListPageMain, mutate } =
        useAssetListPage(
            lan === 'en' ? getDefaultComponentConfig() : cnComponentConfig,
            baseRouter,
            schema,
            lan === 'en' ? undefined : cnPageConfig
        );

    const [_, setHeader] = useGlobalState<string>(GlobalStateKeys.Header, '');
    setHeader(labels.header);
    const [showChunkUpload, setShowChunkUpload] = useState(false)
    const [showVideoDialog, setShowVideoDialog] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const toast = useRef<Toast>(null);

    const handleVideoDownload = async (url?: string) => {
        const targetUrl = url || videoUrl;
        if (!targetUrl || !targetUrl.startsWith('http')) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: labels.invalidUrl });
            return;
        }

        setIsDownloading(true);
        try {
            await downloadVideo(targetUrl);
            toast.current?.show({ severity: 'success', summary: 'Success', detail: 'Download completed' });
            mutate();
            setShowVideoDialog(false);
            setVideoUrl('');
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Download failed' });
        } finally {
            setIsDownloading(false);
        }
    }

    const checkClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text && text.startsWith('http')) {
                if (window.confirm(labels.clipboardConfirm)) {
                    await handleVideoDownload(text);
                } else {
                    setShowVideoDialog(true);
                }
            } else {
                setShowVideoDialog(true);
            }
        } catch (err) {
            setShowVideoDialog(true);
        }
    }

    return <>
        <Toast ref={toast} />
        <br />
        <div className="flex gap-5 justify-between">
            <div className="flex gap-2">
                <SelectButton
                    value={displayMode}
                    onChange={(e: SelectButtonChangeEvent) => setDisplayMode(e.value)}
                    options={displayModeOptions}
                />
            </div>
            <div className="flex gap-2">
                <Button icon="pi pi-youtube" label={labels.downloadVideo} className="p-button-secondary" onClick={checkClipboard} />
                <Button label={labels.chunkedUpload} onClick={() => setShowChunkUpload(true)} />
            </div>
        </div>
        <AssetListPageMain />
        <Dialog onHide={() => setShowChunkUpload(false)} visible={showChunkUpload}>
            <ChunkUpload onSuccess={() => {
                mutate();
                setShowChunkUpload(false);
            }} />
        </Dialog>

        <Dialog header={labels.downloadVideo} visible={showVideoDialog} onHide={() => !isDownloading && setShowVideoDialog(false)} style={{ width: '400px' }}>
            <div className="flex flex-column gap-3">
                <label>{labels.videoUrlLabel}</label>
                <InputText value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} disabled={isDownloading} placeholder="https://" />
                <div className="flex justify-end gap-2">
                    <Button label={isDownloading ? labels.downloading : labels.download} icon={isDownloading ? "pi pi-spin pi-spinner" : "pi pi-download"} onClick={() => handleVideoDownload()} disabled={isDownloading || !videoUrl} />
                </div>
                {isDownloading && (
                    <div className="flex justify-center mt-3">
                        <ProgressSpinner style={{ width: '30px', height: '30px' }} />
                    </div>
                )}
            </div>
        </Dialog>
    </>
}