import { Routes } from '@angular/router';
import { signedIn, signedOut } from './core/guards';

/**
 * Every screen is lazy — the admin is a local tool, but it keeps the initial
 * load small enough that the login screen appears instantly.
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [signedOut],
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'services',
    canActivate: [signedIn],
    loadComponent: () => import('./pages/catalog/catalog-list').then((m) => m.CatalogList),
    data: { table: 'services' },
  },
  {
    path: 'services/:id',
    canActivate: [signedIn],
    loadComponent: () => import('./pages/catalog/catalog-edit').then((m) => m.CatalogEdit),
    data: { table: 'services' },
  },
  {
    path: 'projects',
    canActivate: [signedIn],
    loadComponent: () => import('./pages/catalog/catalog-list').then((m) => m.CatalogList),
    data: { table: 'projects' },
  },
  {
    path: 'projects/:id',
    canActivate: [signedIn],
    loadComponent: () => import('./pages/catalog/catalog-edit').then((m) => m.CatalogEdit),
    data: { table: 'projects' },
  },
  {
    path: 'blocks',
    canActivate: [signedIn],
    loadComponent: () => import('./pages/blocks/block-list').then((m) => m.BlockList),
  },
  {
    path: 'blocks/:key',
    canActivate: [signedIn],
    loadComponent: () => import('./pages/blocks/block-edit').then((m) => m.BlockEdit),
  },
  {
    path: 'settings',
    canActivate: [signedIn],
    loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings),
  },
  {
    path: 'media',
    canActivate: [signedIn],
    loadComponent: () => import('./pages/media/media').then((m) => m.Media),
  },
  { path: '', pathMatch: 'full', redirectTo: 'services' },
  { path: '**', redirectTo: 'services' },
];
