type Props = {
  isOnline: boolean;
  pendingCount: number;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorCount: number;
  onSync: () => void;
  onRetry: () => void;
};

export function SyncStatusBar({ isOnline, pendingCount, status, errorCount, onSync, onRetry }: Props) {
  const showPending = isOnline && pendingCount > 0;
  const showOffline = !isOnline;
  const showSyncing = status === 'syncing';
  const showSuccess = status === 'success';
  const showError = status === 'error';

  if (!showPending && !showOffline && !showSyncing && !showSuccess && !showError) {
    return null;
  }

  return (
    <div className={`sync-status-bar ${showOffline ? 'offline' : 'online'}`}>
      <div className="sync-status-copy">
        {showSyncing && <span>Syncing...</span>}
        {showSuccess && <span>Synced</span>}
        {showError && <span>Sync failed - {errorCount} errors</span>}
        {showOffline && <span>You are offline - changes will sync when reconnected</span>}
        {!showSyncing && !showSuccess && !showError && showPending && (
          <span>{pendingCount} changes pending</span>
        )}
      </div>
      <div className="sync-status-actions">
        {showError ? (
          <button className="sync-status-button" onClick={onRetry}>
            Retry sync
          </button>
        ) : showOffline ? (
          <button className="sync-status-button" disabled>
            Sync unavailable
          </button>
        ) : showSyncing ? (
          <button className="sync-status-button" disabled>
            Syncing...
          </button>
        ) : showPending ? (
          <button className="sync-status-button" onClick={onSync}>
            Sync now
          </button>
        ) : null}
      </div>
    </div>
  );
}
