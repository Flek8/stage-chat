import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './shared/services/auth.guard';

const routes: Routes = [
  {
    path: 'chat/:id',
    loadChildren: () => import('./features/folder/folder.module').then( m => m.FolderPageModule), canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadChildren: () => import('./features/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then( m => m.HomePageModule), canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
