import {Toast as PrimeReactToast} from "primereact/toast";
import {ToastProps} from "@cms/sdk";


export function Toast(props: ToastProps) {
    return (<PrimeReactToast ref={props.ref}/>)
}