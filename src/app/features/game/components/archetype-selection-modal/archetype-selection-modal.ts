import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { PlayerArchetype, StatName } from '../../../../../../shared/types';

interface ArchetypeInfo {
  id: PlayerArchetype;
  name: string;
  description: string;
  icon: string;
  highStats: { stat: StatName; value: number }[];
  mediumStats: { stat: StatName; value: number }[];
  lowStats: { stat: StatName; value: number }[];
}

@Component({
  selector: 'app-archetype-selection-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatCardModule],
  templateUrl: './archetype-selection-modal.html',
  styleUrl: './archetype-selection-modal.css',
})
export class ArchetypeSelectionModal {
  private dialogRef = inject(MatDialogRef<ArchetypeSelectionModal>);

  selectedArchetype: PlayerArchetype | null = null;

  archetypes: ArchetypeInfo[] = [
    {
      id: 'athlete',
      name: 'Athlete',
      description: 'Strong, energetic, and physically capable. Excels at physical activities and sports.',
      icon: '🏃',
      highStats: [
        { stat: 'fitness', value: 25 },
        { stat: 'vitality', value: 25 }
      ],
      mediumStats: [
        { stat: 'confidence', value: 15 },
        { stat: 'ambition', value: 15 },
        { stat: 'poise', value: 15 }
      ],
      lowStats: [
        { stat: 'knowledge', value: 5 },
        { stat: 'creativity', value: 5 },
        { stat: 'wit', value: 5 },
        { stat: 'empathy', value: 5 }
      ]
    },
    {
      id: 'scholar',
      name: 'Scholar',
      description: 'Intelligent, curious, and creative thinker. Thrives in academic and intellectual pursuits.',
      icon: '📚',
      highStats: [
        { stat: 'knowledge', value: 25 },
        { stat: 'creativity', value: 25 }
      ],
      mediumStats: [
        { stat: 'ambition', value: 15 },
        { stat: 'wit', value: 15 },
        { stat: 'vitality', value: 15 }
      ],
      lowStats: [
        { stat: 'fitness', value: 5 },
        { stat: 'confidence', value: 5 },
        { stat: 'poise', value: 5 },
        { stat: 'empathy', value: 5 }
      ]
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Charismatic, witty, and empathetic. Natural at making friends and understanding people.',
      icon: '🦋',
      highStats: [
        { stat: 'confidence', value: 25 },
        { stat: 'wit', value: 25 },
        { stat: 'empathy', value: 25 }
      ],
      mediumStats: [
        { stat: 'poise', value: 15 },
        { stat: 'vitality', value: 15 }
      ],
      lowStats: [
        { stat: 'fitness', value: 5 },
        { stat: 'knowledge', value: 5 },
        { stat: 'creativity', value: 5 },
        { stat: 'ambition', value: 5 }
      ]
    },
    {
      id: 'artist',
      name: 'Artist',
      description: 'Creative, empathetic, and expressive. Lives for artistic expression and emotional connection.',
      icon: '🎨',
      highStats: [
        { stat: 'creativity', value: 25 },
        { stat: 'empathy', value: 25 }
      ],
      mediumStats: [
        { stat: 'poise', value: 15 },
        { stat: 'wit', value: 15 },
        { stat: 'vitality', value: 15 }
      ],
      lowStats: [
        { stat: 'fitness', value: 5 },
        { stat: 'ambition', value: 5 },
        { stat: 'knowledge', value: 5 },
        { stat: 'confidence', value: 5 }
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Driven, knowledgeable, and career-focused. Ambitious climber with strong work ethic.',
      icon: '💼',
      highStats: [
        { stat: 'ambition', value: 25 },
        { stat: 'knowledge', value: 25 }
      ],
      mediumStats: [
        { stat: 'vitality', value: 15 },
        { stat: 'confidence', value: 15 },
        { stat: 'poise', value: 15 }
      ],
      lowStats: [
        { stat: 'creativity', value: 5 },
        { stat: 'empathy', value: 5 },
        { stat: 'fitness', value: 5 },
        { stat: 'wit', value: 5 }
      ]
    },
    {
      id: 'balanced',
      name: 'Balanced',
      description: 'Well-rounded and versatile. No particular strengths or weaknesses, free to develop any direction.',
      icon: '⚖️',
      highStats: [],
      mediumStats: [
        { stat: 'fitness', value: 15 },
        { stat: 'vitality', value: 15 },
        { stat: 'poise', value: 15 },
        { stat: 'knowledge', value: 15 },
        { stat: 'creativity', value: 15 },
        { stat: 'ambition', value: 15 },
        { stat: 'confidence', value: 15 },
        { stat: 'wit', value: 15 },
        { stat: 'empathy', value: 15 }
      ],
      lowStats: []
    },
    {
      id: 'debug_advanced',
      name: '🔧 Debug: Advanced',
      description: '[DEBUG] Moderately high stats for testing intermediate gameplay without prolonged training.',
      icon: '🔧',
      highStats: [
        { stat: 'fitness', value: 50 },
        { stat: 'vitality', value: 50 },
        { stat: 'poise', value: 50 },
        { stat: 'knowledge', value: 50 },
        { stat: 'creativity', value: 50 },
        { stat: 'ambition', value: 50 },
        { stat: 'confidence', value: 50 },
        { stat: 'wit', value: 50 },
        { stat: 'empathy', value: 50 }
      ],
      mediumStats: [],
      lowStats: []
    },
    {
      id: 'debug_master',
      name: '🔧 Debug: Master',
      description: '[DEBUG] Very high stats for testing advanced gameplay features without any training.',
      icon: '⚡',
      highStats: [
        { stat: 'fitness', value: 80 },
        { stat: 'vitality', value: 80 },
        { stat: 'poise', value: 80 },
        { stat: 'knowledge', value: 80 },
        { stat: 'creativity', value: 80 },
        { stat: 'ambition', value: 80 },
        { stat: 'confidence', value: 80 },
        { stat: 'wit', value: 80 },
        { stat: 'empathy', value: 80 }
      ],
      mediumStats: [],
      lowStats: []
    }
  ];

  selectArchetype(archetype: PlayerArchetype): void {
    this.selectedArchetype = archetype;
  }

  confirm(): void {
    if (this.selectedArchetype) {
      this.dialogRef.close(this.selectedArchetype);
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  getStatLabel(stat: StatName): string {
    const labels: Record<StatName, string> = {
      fitness: 'Fitness',
      vitality: 'Vitality',
      poise: 'Poise',
      knowledge: 'Knowledge',
      creativity: 'Creativity',
      ambition: 'Ambition',
      confidence: 'Confidence',
      wit: 'Wit',
      empathy: 'Empathy'
    };
    return labels[stat];
  }
}
