import { forwardRef, type ComponentProps } from 'react';
import { ArrowLeft as AL, ArrowRight as AR, ChevronLeft as CL, ChevronRight as CR } from 'lucide-react';

// Direction arrows point the other way in end-to-left languages (see .rtl-flip in index.css).
const flip = (Icon: typeof AL) => forwardRef<SVGSVGElement, ComponentProps<typeof AL>>(({ className, ...p }, ref) => <Icon ref={ref} className={`rtl-flip${className ? ' ' + className : ''}`} {...p} />);
export const ArrowLeft = flip(AL);
export const ArrowRight = flip(AR);
export const ChevronLeft = flip(CL);
export const ChevronRight = flip(CR);
