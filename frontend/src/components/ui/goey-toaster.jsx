import { GooeyToaster as GoeyToasterPrimitive } from 'goey-toast';
import 'goey-toast/styles.css';

function GoeyToaster(props) {
  return <GoeyToasterPrimitive position="bottom-right" {...props} />;
}

export { GoeyToaster };
