import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { TaskToast } from './shared/task-toast/task-toast';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TaskToast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit{
  isLogin: boolean = true;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isLogin = event.url === '/' || event.url === '' || event.urlAfterRedirects === '/';
      });
  }
}
