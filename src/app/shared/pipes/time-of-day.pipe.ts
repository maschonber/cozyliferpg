import { Pipe, PipeTransform } from '@angular/core';
import { TimeOfDay } from '../../../../shared/types';

/**
 * Formats a TimeOfDay object to a display string (HH:MM)
 *
 * Usage: {{ timeOfDay | timeOfDay }}
 */
@Pipe({
  name: 'timeOfDay',
  standalone: true,
})
export class TimeOfDayPipe implements PipeTransform {
  transform(value: TimeOfDay | null | undefined): string {
    if (!value) {
      return '';
    }
    const hours = String(value.hours).padStart(2, '0');
    const minutes = String(value.minutes ?? 0).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
