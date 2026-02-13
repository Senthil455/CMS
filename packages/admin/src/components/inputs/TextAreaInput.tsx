import React from "react";
import {InputTextarea} from "primereact/inputtextarea";
import {InputPanel} from "./InputPanel";
import {TextAreaInputProps} from "@cms/sdk";


export function TextAreaInput( props: TextAreaInputProps) {
    return <InputPanel  {...props} childComponent={ (field:any) =>
        <InputTextarea rows={4} id={field.name} value={field.value} className={' w-full'} onChange={(e) => field.onChange(e.target.value)} />
    }/>
}