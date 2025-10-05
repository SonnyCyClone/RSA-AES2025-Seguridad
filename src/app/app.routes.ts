import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/rsa-visualizer/rsa-visualizer.component')
      .then(m => m.RsaVisualizerComponent)
  }
];
