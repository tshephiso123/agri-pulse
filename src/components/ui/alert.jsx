import { cn } from '../../lib/utils';
export function Alert({ className, variant, ...props }) { return <div role={variant === 'destructive' ? 'alert' : 'status'} className={cn('ui-alert', variant === 'destructive' && 'ui-alert-error', className)} {...props} />; }
export function AlertTitle(props) { return <h3 className="mb-1 font-semibold" {...props} />; }
export function AlertDescription(props) { return <div className="leading-relaxed" {...props} />; }
