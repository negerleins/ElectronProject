// Path Resolver
import { isDev } from './util.js';
import { app } from 'electron';
import path from 'path';

export function getPreloadPath() {
  return path.join(
    app.getAppPath(),
    isDev() ? '.' : '..',
    '/dist-electron/preload.cjs'
  );
}

export function getInterfacePath() {
    return path.join(
        app.getAppPath(),
        '/dist-interface'
    );
}
