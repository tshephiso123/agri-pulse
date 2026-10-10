import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

export default function Feedback({ error, message, children }) {
  const { t } = useTranslation();
  function detail(value) {
    if (/QuotaExceeded|InvalidState|transaction|database|IndexedDB|object store|Fictional storage/i.test(value)) return t('ui_record_storage_error');
    if (/Failed to fetch|fetch failed|NetworkError/i.test(value)) return t('ui_connection_error');
    if (value === 'Passphrase incorrect or vault damaged.') return t('ui_passphrase_error');
    if (/Unsupported vault format|Invalid backup|Unexpected token|JSON/i.test(value)) return t('ui_data_error');
    return t(value);
  }
     return <Alert variant={error ? 'destructive' : undefined}>
        <div className="flex gap-3">{error ? 
            <AlertCircle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />}
            <div>
                <AlertTitle>{error ? t("Something needs your attention") : t("Done")}</AlertTitle>
                <AlertDescription>{typeof message === 'string' ? t(message) : <>{detail(message.detail)} {t(message.text)}</>}</AlertDescription>{children}
            </div>
        </div>
        </Alert>; }
