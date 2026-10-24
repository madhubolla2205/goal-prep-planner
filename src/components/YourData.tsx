import { useRef, useState, useSyncExternalStore } from 'react';
import { backupFileName, makeBackup, mergeBackup, parseBackup } from '../lib/backup';
import { daysBetween, type ISODate } from '../lib/dates';
import { canInstall, install, isInstalled, isIOS, subscribeInstall } from '../lib/device';
import { loadLastBackup, saveLastBackup, type AppState } from '../lib/storage';
import { Icon } from './Icon';

function backupFile(state: AppState, today: ISODate): File {
  return new File([JSON.stringify(makeBackup(state), null, 2)], backupFileName(today), { type: 'application/json' });
}

function lastBackupText(last: ISODate | null, today: ISODate): string {
  if (!last) return 'No backup saved from this device yet.';
  const days = daysBetween(last, today);
  if (days <= 0) return 'Last backup: today.';
  return `Last backup: ${days === 1 ? 'yesterday' : `${days} days ago`}.`;
}

interface RestoreProps {
  state: AppState;
  onRestore: (next: AppState) => void;
  className?: string;
  label?: string;
}

/** Opens a backup file and adds its goals to this device. */
export function RestoreButton({ state, onRestore, className = 'ghost', label = 'Restore from file' }: RestoreProps) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const restore = async (file: File | undefined) => {
    if (!file) return;
    setError('');
    try {
      const incoming = parseBackup(await file.text());
      const n = incoming.goals.length;
      const names = incoming.goals.map((g) => g.name).join(', ');
      const replaces = incoming.goals.some((g) => state.goals.some((h) => h.id === g.id));
      const question = `Restore ${n} goal${n === 1 ? '' : 's'} (${names})?` +
        (replaces ? '\n\nGoals already on this device are replaced by the copy in the backup.' : '');
      if (n === 0 || confirm(question)) onRestore(mergeBackup(state, incoming));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The file could not be read.');
    }
  };

  return (
    <>
      <button type="button" className={className} onClick={() => input.current?.click()}>
        <Icon name="upload" size={16} /> {label}
      </button>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          void restore(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error && <p className="data-error small" role="alert">{error}</p>}
    </>
  );
}

interface Props {
  state: AppState;
  today: ISODate;
  /** Whether the browser agreed not to clear the app's data; null while asking. */
  protectedData: boolean | null;
  onRestore: (next: AppState) => void;
}

/** Install, backup and restore: what keeps the plans safe without an account. */
export function YourData({ state, today, protectedData, onRestore }: Props) {
  const installable = useSyncExternalStore(subscribeInstall, canInstall);
  const [installed, setInstalled] = useState(isInstalled);
  const [lastBackup, setLastBackup] = useState(loadLastBackup);
  const canShare = typeof navigator.canShare === 'function' && navigator.canShare({ files: [backupFile(state, today)] });

  const saved = () => {
    saveLastBackup(today);
    setLastBackup(today);
  };

  const download = () => {
    const url = URL.createObjectURL(backupFile(state, today));
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName(today);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    saved();
  };

  const share = async () => {
    try {
      await navigator.share({ files: [backupFile(state, today)], title: 'Goal Prep Planner backup' });
      saved();
    } catch {
      // Closing the share sheet is not an error worth showing.
    }
  };

  return (
    <div className="card your-data">
      <div className="card-head">
        <h3 className="with-icon"><span className="icon-badge"><Icon name="shield" size={16} /></span>Your data</h3>
      </div>
      <p className="muted small">
        Your plans and progress are saved only in this browser on this device. There's no account, so a backup file is how you keep a copy or carry on somewhere else.
      </p>

      <section className="data-row">
        <div>
          <strong>Back up</strong>
          <p className="muted small">{lastBackupText(lastBackup, today)} Open the file on another phone or computer with "Restore from file" to continue there.</p>
        </div>
        <div className="data-actions">
          <button type="button" onClick={download}><Icon name="download" size={16} /> Save backup</button>
          {canShare && <button type="button" className="ghost" onClick={share}>Send to another device</button>}
          <RestoreButton state={state} onRestore={onRestore} />
        </div>
      </section>

      <section className="data-row">
        <div>
          <strong>Install as an app</strong>
          <p className="muted small">
            {installed
              ? 'Installed. Open it from your home screen; it works without internet too.'
              : installable
                ? 'Add it to your home screen or desktop. It opens like an app and works without internet.'
                : isIOS()
                  ? 'In Safari, tap Share, then "Add to Home Screen". It then opens like an app and works without internet.'
                  : 'Use your browser\'s menu and choose "Install" or "Add to Home screen". It then works without internet.'}
          </p>
        </div>
        {!installed && installable && (
          <div className="data-actions">
            <button type="button" onClick={async () => setInstalled(await install())}><Icon name="phone" size={16} /> Install</button>
          </div>
        )}
      </section>

      <p className={`data-status small ${protectedData ? 'ok' : ''}`}>
        <Icon name={protectedData ? 'check' : 'shield'} size={15} />
        {protectedData === null
          ? 'Checking whether this browser keeps your data…'
          : protectedData
            ? "This browser won't clear your data to free up space."
            : 'This browser may clear data from sites you haven\'t opened in a while. Installing the app helps; a backup keeps you safe either way.'}
      </p>
    </div>
  );
}
