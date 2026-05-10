export const DEFAULT_APP_NAME = 'Hi Pipe';

export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME?.trim() || DEFAULT_APP_NAME;
}

export function setAppNameMetadata(appName: string): void {
  document.title = appName;

  const metaName = document.querySelector<HTMLMetaElement>('meta[name="application-name"]');
  if (metaName) {
    metaName.setAttribute('content', appName);
  }

  const appleMeta = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
  if (appleMeta) {
    appleMeta.setAttribute('content', appName);
  }
}
