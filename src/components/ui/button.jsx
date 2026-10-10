import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';
export function Button({ className, variant = 'default', asChild = false, ...props }) { const Comp = asChild ? Slot : 'button'; return <Comp className={cn('ui-button', { default: 'ui-primary', outline: 'ui-outline', ghost: 'ui-ghost', destructive: 'ui-danger' }[variant], className)} {...props} />; }
