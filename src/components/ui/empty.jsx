import { cn } from '../../lib/utils';
export function Empty({ className, ...props }) { return <div className={cn('flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center', className)} {...props} />; }
export function EmptyTitle(props) { return <h3 className="text-xl font-semibold text-stone-800" {...props} />; }
export function EmptyDescription(props) { return <p className="max-w-sm text-base leading-relaxed text-stone-600" {...props} />; }
