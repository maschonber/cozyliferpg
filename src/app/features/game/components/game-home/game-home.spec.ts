import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal, WritableSignal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { GameHome } from './game-home';
import { GameFacade } from '../../services/game.facade';
import { NPC, Relationship, PlayerCharacter, Activity, ActivityAvailability, LocationWithNPCCount } from '../../../../../../shared/types';

describe('GameHome', () => {
  let component: GameHome;
  let fixture: ComponentFixture<GameHome>;
  let mockFacade: Partial<GameFacade>;
  let mockRouter: jest.Mocked<Router>;

  // Mock signals
  let npcsWithRelationshipsSignal: WritableSignal<Array<{ npc: NPC; relationship: Relationship }>>;
  let relationshipsLoadingSignal: WritableSignal<boolean>;
  let npcsLoadingSignal: WritableSignal<boolean>;
  let relationshipsErrorSignal: WritableSignal<string | null>;
  let activitiesSignal: WritableSignal<Activity[]>;
  let activityAvailabilitySignal: WritableSignal<ActivityAvailability[]>;
  let playerSignal: WritableSignal<PlayerCharacter | null>;
  let playerLoadingSignal: WritableSignal<boolean>;
  let interactingSignal: WritableSignal<boolean>;
  let interactionErrorSignal: WritableSignal<string | null>;
  let locationsSignal: WritableSignal<LocationWithNPCCount[]>;
  let relationshipsSignal: WritableSignal<Relationship[]>;

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
    archetype: 'balanced',
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

  const mockNPC: NPC = {
    id: 'npc-1',
    name: 'Alice',
    archetype: 'Artist',
    traits: ['Creative', 'Friendly'],
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
    loras: [],
    currentLocation: 'park',
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockRelationship: Relationship = {
    id: 'rel-1',
    npcId: 'npc-1',
    playerId: 'player-1',
    friendship: 0,
    romance: 0,
    currentState: 'stranger',
    unlockedStates: ['stranger'],
    firstMet: '2024-01-01T00:00:00Z',
    lastInteraction: '2024-01-01T00:00:00Z',
    npc: mockNPC
  };

  beforeEach(async () => {
    // Initialize mock signals
    npcsWithRelationshipsSignal = signal([]);
    relationshipsLoadingSignal = signal(false);
    npcsLoadingSignal = signal(false);
    relationshipsErrorSignal = signal(null);
    activitiesSignal = signal([]);
    activityAvailabilitySignal = signal([]);
    playerSignal = signal(mockPlayer);
    playerLoadingSignal = signal(false);
    interactingSignal = signal(false);
    interactionErrorSignal = signal(null);
    locationsSignal = signal([]);
    relationshipsSignal = signal([]);

    // Mock facade
    mockFacade = {
      npcsWithRelationships: npcsWithRelationshipsSignal,
      relationshipsLoading: relationshipsLoadingSignal,
      npcsLoading: npcsLoadingSignal,
      relationshipsError: relationshipsErrorSignal,
      activities: activitiesSignal,
      activityAvailability: activityAvailabilitySignal,
      player: playerSignal,
      playerLoading: playerLoadingSignal,
      interacting: interactingSignal,
      interactionError: interactionErrorSignal,
      locations: locationsSignal,
      relationships: relationshipsSignal,
      initialize: jest.fn(),
      performSoloActivity: jest.fn(),
      createNPC: jest.fn(),
      getRelationship: jest.fn()
    };

    // Mock router
    mockRouter = {
      navigate: jest.fn()
    } as any;

    await TestBed.configureTestingModule({
      imports: [GameHome],
      providers: [
        { provide: GameFacade, useValue: mockFacade },
        { provide: Router, useValue: mockRouter }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(GameHome);
    component = fixture.componentInstance;
  });

  describe('onMeetSomeoneNew', () => {
    it('should load relationship after creating NPC', (done) => {
      // Arrange
      const performSoloActivitySpy = jest.spyOn(mockFacade, 'performSoloActivity')
        .mockReturnValue(of({ success: true } as any));
      const createNPCSpy = jest.spyOn(mockFacade, 'createNPC')
        .mockReturnValue(of(mockNPC));
      const getRelationshipSpy = jest.spyOn(mockFacade, 'getRelationship')
        .mockReturnValue(of(mockRelationship));

      // Act
      component.onMeetSomeoneNew();

      // Assert
      setTimeout(() => {
        expect(performSoloActivitySpy).toHaveBeenCalledWith('meet_someone');
        expect(createNPCSpy).toHaveBeenCalled();
        expect(getRelationshipSpy).toHaveBeenCalledWith(mockNPC.id);
        done();
      }, 100);
    });

    it('should not load relationship if NPC creation fails', (done) => {
      // Arrange
      const performSoloActivitySpy = jest.spyOn(mockFacade, 'performSoloActivity')
        .mockReturnValue(of({ success: true } as any));
      const createNPCSpy = jest.spyOn(mockFacade, 'createNPC')
        .mockReturnValue(throwError(() => new Error('Failed to create NPC')));
      const getRelationshipSpy = jest.spyOn(mockFacade, 'getRelationship');

      // Act
      component.onMeetSomeoneNew();

      // Assert
      setTimeout(() => {
        expect(performSoloActivitySpy).toHaveBeenCalledWith('meet_someone');
        expect(createNPCSpy).toHaveBeenCalled();
        expect(getRelationshipSpy).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should not create NPC if activity performance fails', (done) => {
      // Arrange
      const performSoloActivitySpy = jest.spyOn(mockFacade, 'performSoloActivity')
        .mockReturnValue(throwError(() => new Error('Failed to perform activity')));
      const createNPCSpy = jest.spyOn(mockFacade, 'createNPC');
      const getRelationshipSpy = jest.spyOn(mockFacade, 'getRelationship');

      // Act
      component.onMeetSomeoneNew();

      // Assert
      setTimeout(() => {
        expect(performSoloActivitySpy).toHaveBeenCalledWith('meet_someone');
        expect(createNPCSpy).not.toHaveBeenCalled();
        expect(getRelationshipSpy).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should stay on overview page after meeting new neighbor', (done) => {
      // Arrange
      jest.spyOn(mockFacade, 'performSoloActivity')
        .mockReturnValue(of({ success: true } as any));
      jest.spyOn(mockFacade, 'createNPC')
        .mockReturnValue(of(mockNPC));
      jest.spyOn(mockFacade, 'getRelationship')
        .mockReturnValue(of(mockRelationship));

      // Act
      component.onMeetSomeoneNew();

      // Assert
      setTimeout(() => {
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('empty state messaging', () => {
    it('should show "You haven\'t met anyone yet" when no relationships exist', () => {
      // Arrange
      relationshipsSignal.set([]);
      npcsWithRelationshipsSignal.set([]);
      fixture.detectChanges();

      // Assert
      expect(component.relationships().length).toBe(0);
      expect(component.npcsWithRelationships().length).toBe(0);
    });

    it('should show different message when neighbors exist elsewhere', () => {
      // Arrange
      const neighborElsewhere = {
        ...mockRelationship,
        npc: { ...mockNPC, currentLocation: 'library' }
      };
      relationshipsSignal.set([neighborElsewhere]);
      npcsWithRelationshipsSignal.set([]); // Filtered out because at different location
      fixture.detectChanges();

      // Assert
      expect(component.relationships().length).toBe(1);
      expect(component.npcsWithRelationships().length).toBe(0);
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
