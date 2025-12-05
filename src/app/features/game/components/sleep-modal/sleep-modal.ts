import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { SleepResult } from '../../../../../../shared/types';

export interface SleepModalData {
  sleepResult: SleepResult;
  previousDay: number;
}

@Component({
  selector: 'app-sleep-modal',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './sleep-modal.html',
  styleUrl: './sleep-modal.css',
})
export class SleepModal {
  private dialogRef = inject(MatDialogRef<SleepModal>);
  data = inject<SleepModalData>(MAT_DIALOG_DATA);

  onContinue(): void {
    this.dialogRef.close();
  }
}
