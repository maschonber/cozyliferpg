import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/components/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { neighborDetailResolver } from './core/resolvers/neighbor-detail.resolver';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'emotion-sandbox',
    loadComponent: () => import('./features/emotion-sandbox/emotion-sandbox.component').then(m => m.EmotionSandboxComponent)
  },
  {
    path: 'game',
    canActivate: [authGuard],
    loadComponent: () => import('./features/game/components/game-layout/game-layout').then(m => m.GameLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/game/components/game-home/game-home').then(m => m.GameHome)
      },
      {
        path: 'neighbor/:id',
        loadComponent: () => import('./features/game/components/neighbor-detail/neighbor-detail').then(m => m.NeighborDetail),
        resolve: { data: neighborDetailResolver }
      },
      {
        path: 'travel',
        loadComponent: () => import('./features/game/components/location-selector/location-selector').then(m => m.LocationSelector)
      }
    ]
  },
  {
    path: '',
    redirectTo: 'game',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'game'
  }
];
