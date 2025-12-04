import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/components/login/login.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'game',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/game/components/game-home/game-home').then(m => m.GameHome)
      },
      {
        path: 'neighbor/:id',
        loadComponent: () => import('./features/game/components/neighbor-detail/neighbor-detail').then(m => m.NeighborDetail)
      }
    ]
  },
  {
    path: 'main',
    loadComponent: () => import('./main/main.component').then(m => m.MainComponent),
    canActivate: [authGuard]
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
