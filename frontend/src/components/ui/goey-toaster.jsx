import { GooeyToaster as GoeyToasterPrimitive, gooeyToast as goeyToast } from "goey-toast"
import "goey-toast/styles.css"

export { goeyToast }

function GoeyToaster(props) {
  return <GoeyToasterPrimitive position="bottom-right" {...props} />;
}

export { GoeyToaster }
