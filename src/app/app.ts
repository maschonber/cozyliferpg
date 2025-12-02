import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('CozyLife RPG');
  protected readonly subtitle = signal('A relaxing life simulation adventure');
  protected readonly counter = signal(0);

  protected readonly features = [
    { icon: '🏡', title: 'Build Your Home', description: 'Create and customize your cozy living space' },
    { icon: '🌱', title: 'Grow Your Garden', description: 'Plant and harvest crops in your personal garden' },
    { icon: '🎣', title: 'Explore Activities', description: 'Fish, cook, craft, and discover new hobbies' },
    { icon: '👥', title: 'Meet Villagers', description: 'Build relationships with charming characters' }
  ];

  increment() {
    this.counter.update(val => val + 1);
  }

  decrement() {
    this.counter.update(val => val - 1);
  }

  reset() {
    this.counter.set(0);
  }
}
