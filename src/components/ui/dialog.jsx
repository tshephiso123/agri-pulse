import { useTranslation } from 'react-i18next';
// shadcn/ui Dialog built on Radix: focus trap, Escape and focus return.
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Button } from './button';
export function ConfirmDialog({ open, onOpenChange, title, description, onConfirm, busy, returnFocus }) {
  const { t } = useTranslation();
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}><DialogPrimitive.Portal><DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[var(--ink)] opacity-50" /><DialogPrimitive.Content onCloseAutoFocus={event => { event.preventDefault(); returnFocus?.current?.focus(); }} className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-16px)] max-w-md -translate-x-1/2 -translate-y-1/2 delete-dialog bg-[var(--surface)] p-[16px] max-h-[calc(100dvh-16px)] flex flex-col"><div className="min-h-0 overflow-auto"><DialogPrimitive.Title className="screen-heading">{title}</DialogPrimitive.Title><DialogPrimitive.Description className="mt-3 secondary-copy leading-relaxed">{description}</DialogPrimitive.Description></div><div className="mt-[16px] grid grid-cols-2 shrink-0 gap-[12px]"><DialogPrimitive.Close asChild><Button variant="outline" disabled={busy}>{t("Cancel")}</Button></DialogPrimitive.Close><Button variant="destructive" disabled={busy} onClick={onConfirm}>{busy ? t("Deleting…") : t("Delete entry")}</Button></div></DialogPrimitive.Content></DialogPrimitive.Portal></DialogPrimitive.Root>;
}
