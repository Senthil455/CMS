import {Editor} from 'primereact/editor';
import {InputPanel} from "./InputPanel";
import React, { useState, useEffect } from "react";
import {EditorInputProps} from "@cms/sdk";
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SelectButton } from 'primereact/selectbutton';

const renderHeader = () => {
    return <>
            <span className="ql-formats">
                 <select className="ql-header" defaultValue="5">
                    <option value="3">Heading</option>
                    <option value="4">Subheading</option>
                    <option value="5">Normal</option>
                </select>
            </span>
        <select className="ql-size" defaultValue="medium">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
        </select>

        <span className="ql-formats">
                    <button className="ql-bold" aria-label="Bold"></button>
                    <button className="ql-italic" aria-label="Italic"></button>
                    <button className="ql-underline" aria-label="Underline"></button>
                </span>
        <span className="ql-formats">
                <button className="ql-list" value="ordered"/>
                <button className="ql-list" value="bullet"/>
                <button className="ql-indent" value="-1"/>
                <button className="ql-indent" value="+1"/>
            </span>
        <span className="ql-formats">
                <select className="ql-align"/>
                <select className="ql-color"/>
                <select className="ql-background"/>
            </span>
        <span className="ql-formats">
                <button className="ql-link"/>
                <button className="ql-image"/>
                <button className="ql-video"/>
            </span>
    </>
};

function EditorInputInner({ field, column }: { field: any, column: any }) {
    const isHtml = (content?: string) => {
        if (!content) return false;
        // Basic check for HTML tags
        return /<[a-z][\s\S]*>/i.test(content);
    };

    const [type, setType] = useState<'richtext' | 'markdown'>(isHtml(field.value) ? 'richtext' : 'markdown');
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!initialized && field.value) {
            setType(isHtml(field.value) ? 'richtext' : 'markdown');
            setInitialized(true);
        }
    }, [field.value, initialized]);

    const typeOptions = [
        { label: 'Rich Text', value: 'richtext' },
        { label: 'Markdown', value: 'markdown' }
    ];
    
    const viewOptions = [
        { label: 'Edit', value: 'edit' },
        { label: 'Preview', value: 'preview' }
    ];

    return (
        <div className="mt-2">
            <div className="flex align-items-center mb-2" style={{ gap: '1rem' }}>
                <SelectButton 
                    value={type} 
                    onChange={(e) => e.value && setType(e.value)} 
                    options={typeOptions} 
                />
                
                {type === 'markdown' && (
                    <div className="ml-auto">
                        <SelectButton 
                            value={viewMode} 
                            onChange={(e) => e.value && setViewMode(e.value)} 
                            options={viewOptions} 
                        />
                    </div>
                )}
            </div>

            {type === 'richtext' && (
                <Editor 
                    id={field.name} 
                    name={column.field} 
                    value={field.value}
                    headerTemplate={renderHeader()}
                    onTextChange={(e) => field.onChange(e.htmlValue)}
                    style={{height: '320px'}}
                />
            )}

            {type === 'markdown' && viewMode === 'edit' && (
                <div style={{ border: '1px solid #ced4da', borderRadius: '4px', overflow: 'hidden' }}>
                    <CodeMirror
                        value={field.value || ''}
                        height="320px"
                        extensions={[markdown({ base: markdownLanguage, codeLanguages: languages })]}
                        onChange={(val) => field.onChange(val)}
                        theme="light"
                        basicSetup={{
                            lineNumbers: false,
                            foldGutter: false,
                        }}
                    />
                </div>
            )}

            {type === 'markdown' && viewMode === 'preview' && (
                <div style={{ 
                    height: '320px', 
                    overflow: 'auto', 
                    padding: '1rem', 
                    border: '1px solid #ced4da', 
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa'
                }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {field.value || ''}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
}

export function EditorInput(props: EditorInputProps) {
    return <InputPanel  {...props} childComponent={(field: any) =>
        <EditorInputInner field={field} column={props.column} />
    }/>
}