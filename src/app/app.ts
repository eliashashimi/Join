import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { HeaderComponent } from './shared/header/header';
import { SidebarComponent } from './shared/sidebar/sidebar';
import { AddTaskOverlay } from './features/board/add-task-overlay/add-task-overlay';
import { TaskToast } from './shared/task-toast/task-toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TaskToast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  // isLoginPage: boolean = true;

  // constructor(private router: Router) {}

  // ngOnInit() {
  //   this.router.events
  //     .pipe(filter((event) => event instanceof NavigationEnd))
  //     .subscribe((event: any) => {
  //       this.isLoginPage = event.url === '/' || event.url === '' || event.urlAfterRedirects === '/';
  //     });
  // }
}
