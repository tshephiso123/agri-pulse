import { AlertCircle, CheckCircle2, CloudUpload, LockKeyhole, RefreshCw, WifiOff, Wifi, TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
const states = {
  online: { icon: Wifi, label: 'Online' },
  offline: { icon: WifiOff, label: 'ui_offline_description', className: 'state-warning' },
  pending: { icon: CloudUpload, label: 'ui_pending' },
  syncing: { icon: RefreshCw, label: 'Syncing…' },
  saved: { icon: CheckCircle2, label: 'ui_saved' },
  locked: { icon: LockKeyhole, label: 'Your records are protected' },
  conflict: { icon: TriangleAlert, label: 'ui_conflict', className: 'state-warning' },
  error: { icon: AlertCircle, label: 'ui_error', className: 'state-error' }
};
export function StateMessage({ state, children }) {
  const { t } = useTranslation();
  const { icon: Icon, label, className = '' } = states[state];
  return <div role={state === 'error' || state === 'conflict' ? 'alert' : 'status'} className={`state-message ${className}`}><Icon aria-hidden="true" /><div><p>{t(label)}</p>{children}</div></div>;
}
export function LoadingState() {
  const { t } = useTranslation();
  return <div role="status" className="loading-state"><p>{t('ui_loading')}</p><div aria-hidden="true" className="loading-line" /><div aria-hidden="true" className="loading-line" /></div>;
}
