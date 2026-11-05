import { Component, effect, inject, signal } from '@angular/core';
import { TaskOverlayService } from '../../../service/task-overlay-service';
import { TaskForm } from '../../add-task/task-form/task-form';

const ANIMATION_MS = 300;

@Component({
  selector: 'app-add-task-overlay',
  imports: [TaskForm],
  templateUrl: './add-task-overlay.html',
  styleUrl: './add-task-overlay.scss',
  host: { '(document:keydown.escape)': 'close()' },
})
export class AddTaskOverlay {
  private readonly overlay = inject(TaskOverlayService);

  readonly status = this.overlay.status;
  readonly isRendered = signal(false);
  readonly isVisible = signal(false);


  constructor() {
    effect(() => (this.overlay.isOpen() ? this.show() : this.hide()));
  }


  /** Schließt das Add-Task-Overlay. */
  close(): void {
    this.overlay.close();
  }


  /** Zeigt das Overlay an und startet kurz danach die Einblend-Animation. */
  private show(): void {
    this.isRendered.set(true);
    setTimeout(() => this.isVisible.set(true), 20);
  }


  /** Startet die Ausblend-Animation und nimmt das Overlay danach aus der Seite. */
  private hide(): void {
    this.isVisible.set(false);
    setTimeout(() => {
      if (!this.overlay.isOpen()) this.isRendered.set(false);
    }, ANIMATION_MS);
  }
}