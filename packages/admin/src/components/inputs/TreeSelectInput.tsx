import {InputPanel} from "./InputPanel"
import {TreeSelect} from 'primereact/treeselect';
import {TreeSelectInputProps} from "@cms/sdk";

export function TreeSelectInput(props: TreeSelectInputProps) {
    const {column, options} = props
    return <InputPanel  {...props} childComponent={(field: any) => {
        return <TreeSelect
            display="chip"
            value={field.value}
            onChange={(e) => {
                console.log("e.value", e.value)
                field.onChange(e.value)
            }}
            options={options}
            placeholder={"Select " + column.header} className="w-full"/>
    }}/>
}