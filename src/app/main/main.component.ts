import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../core/services/api.service';
import { AuthFacade } from '../features/auth/services/auth.facade';
import { GameItem, ApiResponse } from '../../../shared/types';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent implements OnInit {
  protected readonly title = signal('CozyLife RPG');
  protected readonly subtitle = signal('A relaxing life simulation adventure');
  protected readonly counter = signal(0);

  // Database items
  protected readonly items = signal<GameItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly dbStats = signal<any>(null);

  protected readonly features = [
    { icon: '🏡', title: 'Build Your Home', description: 'Create and customize your cozy living space' },
    { icon: '🌱', title: 'Grow Your Garden', description: 'Plant and harvest crops in your personal garden' },
    { icon: '🎣', title: 'Explore Activities', description: 'Fish, cook, craft, and discover new hobbies' },
    { icon: '👥', title: 'Meet Villagers', description: 'Build relationships with charming characters' }
  ];

  private apiService = inject(ApiService);
  private authFacade = inject(AuthFacade);

  // Expose auth signals for template
  currentUser = this.authFacade.user;

  ngOnInit() {
    this.loadItems();
    this.loadDatabaseStats();
  }

  loadItems() {
    this.isLoading.set(true);
    this.error.set(null);

    this.apiService.getItems().subscribe({
      next: (response: ApiResponse<GameItem[]>) => {
        if (response.success && response.data) {
          this.items.set(response.data);
        }
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading items:', err);
        this.error.set('Failed to load items from database');
        this.isLoading.set(false);
      }
    });
  }

  loadDatabaseStats() {
    this.apiService.getDatabaseStats().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.dbStats.set(response.database);
        }
      },
      error: (err: any) => {
        console.error('Error loading database stats:', err);
      }
    });
  }

  getRarityColor(rarity: string): string {
    const colors: Record<string, string> = {
      'common': '#6c757d',
      'rare': '#0dcaf0',
      'epic': '#a855f7',
      'legendary': '#ffc107'
    };
    return colors[rarity] || colors['common'];
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'furniture': 'Furniture',
      'crop': 'Crop',
      'tool': 'Tool',
      'fish': 'Fish'
    };
    return labels[category] || category;
  }

  increment() {
    this.counter.update(val => val + 1);
  }

  decrement() {
    this.counter.update(val => val - 1);
  }

  reset() {
    this.counter.set(0);
  }

  logout() {
    this.authFacade.logout();
  }
}
