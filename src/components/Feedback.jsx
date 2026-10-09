import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';

export default function Feedback({ error, message, children }) {
  const { t } = useTranslation();
     return <Alert variant={error ? 'destructive' : undefined}>
        <div className="flex gap-3">{error ? 
            <AlertCircle className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" /> : <CheckCircle2 className="mt-1 h-5 w-5 shrink-0" aria-hidden="true" />}
            <div>
                <AlertTitle>{error ? t("Something needs your attention") : t("Done")}</AlertTitle>
                <AlertDescription>{typeof message === 'string' ? t(message) : <>{t(message.detail)} {t(message.text)}</>}</AlertDescription>{children}
            </div>
        </div>
        </Alert>; }
