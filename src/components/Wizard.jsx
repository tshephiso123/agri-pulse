import { useEffect, useRef, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { WizardNavigation } from './WizardNavigation';
export default function Wizard({ title, step, total, onBack, onNext, nextLabel, busy, children, footer, result = false }) {
  const { t } = useTranslation();
  const navigation = useContext(WizardNavigation);
  const heading = useRef(null);
  const content = useRef(null);
  useEffect(() => { content.current?.scrollTo({ top: 0 }); heading.current?.focus(); }, [title, step]);
  return <section className="wizard" aria-busy={busy || undefined}>
    <div className="wizard-content" ref={content} tabIndex={0} aria-label={t('ui_step_content')}>
      {step && total && <div className="step-progress"><p>{t('ui_step', { step, total })}</p><progress aria-label={t('ui_progress')} value={step} max={total} /></div>}
      <h2 ref={heading} tabIndex={-1} className={result ? 'result-heading' : 'screen-heading'}>{title}</h2>
      <div className="step-body">{children}</div>
    </div>
    <footer className="wizard-actions">
      <Button type="button" variant="outline" onClick={onBack || navigation.exit}><ArrowLeft aria-hidden="true" />{t('ui_back')}</Button>
      {onNext && <Button type="button" disabled={busy} onClick={onNext}>{busy ? t('Please wait…') : nextLabel || t('ui_next')}</Button>}
      {footer}
    </footer>
  </section>;
}
