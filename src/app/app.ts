import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header';
import { SidebarComponent } from './shared/sidebar/sidebar';
import { AddTaskOverlay } from './features/board/add-task-overlay/add-task-overlay';
import { TaskToast } from './shared/task-toast/task-toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, AddTaskOverlay, TaskToast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}