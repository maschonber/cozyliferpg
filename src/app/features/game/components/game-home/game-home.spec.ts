import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal, WritableSignal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { GameHome } from './game-home';
import { GameFacade } from '../../services/game.facade';
import { NpcView, PlayerCharacter, Activity, ActivityAvailability, LocationWithNPCCount } from '../../../../../../shared/types';

describe('GameHome', () => {
  let component: GameHome;
  let fixture: ComponentFixture<GameHome>;
  let mockFacade: Partial<GameFacade>;
  let mockRouter: jest.Mocked<Router>;
  let mockDialog: jest.Mocked<MatDialog>;

  // Mock signals
  let npcsAtCurrentLocationSignal: WritableSignal<NpcView[]>;
  let npcsLoadingSignal: WritableSignal<boolean>;
  let npcsErrorSignal: WritableSignal<string | null>;
  let activitiesSignal: WritableSignal<Activity[]>;
  let activityAvailabilitySignal: WritableSignal<ActivityAvailability[]>;
  let playerSignal: WritableSignal<PlayerCharacter | null>;
  let playerLoadingSignal: WritableSignal<boolean>;
  let interactingSignal: WritableSignal<boolean>;
  let interactionErrorSignal: WritableSignal<string | null>;
  let locationsSignal: WritableSignal<LocationWithNPCCount[]>;
  let npcsSignal: WritableSignal<NpcView[]>;

  const mockPlayer: PlayerCharacter = {
    id: 'player-1',
    userId: 'user-1',
    currentEnergy: 100,
    maxEnergy: 100,
    money: 200,
    currentDay: 1,
    currentTime: '09:00',
    lastSleptAt: '00:00',
    currentLocation: 'park',
    archetype: 'social_butterfly',
    stats: {
      baseFitness: 50,
      baseVitality: 50,
      basePoise: 50,
      baseKnowledge: 50,
      baseCreativity: 50,
      baseAmbition: 50,
      baseConfidence: 50,
      baseWit: 50,
      baseEmpathy: 50,
      currentFitness: 50,
      currentVitality: 50,
      currentPoise: 50,
      currentKnowledge: 50,
      currentCreativity: 50,
      currentAmbition: 50,
      currentConfidence: 50,
      currentWit: 50,
      currentEmpathy: 50
    },
    tracking: {
      minEnergyToday: 100,
      workStreak: 0,
      restStreak: 0
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  const mockNpcView: NpcView = {
    id: 'npc-1',
    templateId: 'template-1',
    name: 'Alice',
    gender: 'female',
    appearance: {
      hairColor: 'Brown',
      hairStyle: 'Long',
      eyeColor: 'Blue',
      faceDetails: [],
      bodyType: 'Average',
      torsoSize: 'Medium',
      height: 'Average',
      skinTone: 'Fair',
      upperTrace: 'Casual shirt',
      lowerTrace: 'Jeans',
      style: 'Casual',
      bodyDetails: []
    },
    currentLocation: 'park',
    trust: 0,
    affection: 0,
    desire: 0,
    currentState: 'stranger',
    revealedTraits: [],
    emotionVector: { joySadness: 0, acceptanceDisgust: 0, angerFear: 0, anticipationSurprise: 0 },
    emotionInterpretation: { emotion: 'neutral' }
  };

  beforeEach(async () => {
    // Initialize mock signals
    npcsAtCurrentLocationSignal = signal([]);
    npcsLoadingSignal = signal(false);
    npcsErrorSignal = signal(null);
    activitiesSignal = signal([]);
    activityAvailabilitySignal = signal([]);
    playerSignal = signal(mockPlayer);
    playerLoadingSignal = signal(false);
    interactingSignal = signal(false);
    interactionErrorSignal = signal(null);
    locationsSignal = signal([]);
    npcsSignal = signal([]);

    // Mock facade
    mockFacade = {
      npcsAtCurrentLocation: npcsAtCurrentLocationSignal,
      npcsLoading: npcsLoadingSignal,
      npcsError: npcsErrorSignal,
      npcs: npcsSignal,
      activities: activitiesSignal,
      activityAvailability: activityAvailabilitySignal,
      player: playerSignal,
      playerLoading: playerLoadingSignal,
      interacting: interactingSignal,
      interactionError: interactionErrorSignal,
      locations: locationsSignal,
      initialize: jest.fn(),
      performActivity: jest.fn(),
      createNpc: jest.fn()
    };

    // Mock router
    mockRouter = {
      navigate: jest.fn()
    } as any;

    // Mock dialog
    mockDialog = {
      open: jest.fn().mockReturnValue({
        afterClosed: () => of(null)
      })
    } as any;

    await TestBed.configureTestingModule({
      imports: [GameHome],
      providers: [
        { provide: GameFacade, useValue: mockFacade },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(GameHome);
    component = fixture.componentInstance;
  });

  describe('onMeetSomeoneNew', () => {
    it('should create NPC after performing meet_someone activity', (done) => {
      // Arrange
      const performActivitySpy = jest.spyOn(mockFacade, 'performActivity')
        .mockReturnValue(of({ success: true } as any));
      const createNpcSpy = jest.spyOn(mockFacade, 'createNpc')
        .mockReturnValue(of(mockNpcView));

      // Act
      component.onMeetSomeoneNew();

      // Assert
      setTimeout(() => {
        expect(performActivitySpy).toHaveBeenCalledWith('meet_someone');
        expect(createNpcSpy).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should not create NPC if activity performance fails', (done) => {
      // Arrange
      const performActivitySpy = jest.spyOn(mockFacade, 'performActivity')
        .mockReturnValue(throwError(() => new Error('Failed to perform activity')));
      const createNpcSpy = jest.spyOn(mockFacade, 'createNpc');

      // Act
      component.onMeetSomeoneNew();

      // Assert
      setTimeout(() => {
        expect(performActivitySpy).toHaveBeenCalledWith('meet_someone');
        expect(createNpcSpy).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should stay on overview page after meeting new neighbor', (done) => {
      // Arrange
      jest.spyOn(mockFacade, 'performActivity')
        .mockReturnValue(of({ success: true } as any));
      jest.spyOn(mockFacade, 'createNpc')
        .mockReturnValue(of(mockNpcView));

      // Act
      component.onMeetSomeoneNew();

      // Assert
      setTimeout(() => {
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('empty state', () => {
    it('should have empty npcsAtCurrentLocation when no NPCs at current location', () => {
      // Arrange
      npcsAtCurrentLocationSignal.set([]);
      fixture.detectChanges();

      // Assert
      expect(component.npcsAtCurrentLocation().length).toBe(0);
    });

    it('should show NPCs when they are at current location', () => {
      // Arrange
      npcsAtCurrentLocationSignal.set([mockNpcView]);
      fixture.detectChanges();

      // Assert
      expect(component.npcsAtCurrentLocation().length).toBe(1);
      expect(component.npcsAtCurrentLocation()[0].name).toBe('Alice');
    });
  });

  describe('onViewNeighbor', () => {
    it('should navigate to neighbor detail page', () => {
      // Act
      component.onViewNeighbor('npc-1');

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/game/neighbor', 'npc-1']);
    });
  });
});
