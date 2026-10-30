import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TaskToast } from './shared/task-toast/task-toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TaskToast],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}