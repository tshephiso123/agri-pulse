import { cn } from '../../lib/utils';
export function Skeleton({ className, ...props }) { return <div className={cn('animate-pulse rounded-lg bg-stone-200 motion-reduce:animate-none', className)} {...props} />; }
