import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal, WritableSignal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LocationSelector } from './location-selector';
import { GameFacade } from '../../services/game.facade';
import { LocationWithNPCCount, PlayerCharacter, District } from '../../../../../../shared/types';

describe('LocationSelector', () => {
  let component: LocationSelector;
  let fixture: ComponentFixture<LocationSelector>;
  let mockFacade: Partial<GameFacade>;
  let mockRouter: jest.Mocked<Router>;

  // Mock signals
  let locationsSignal: WritableSignal<LocationWithNPCCount[]>;
  let locationsLoadingSignal: WritableSignal<boolean>;
  let playerSignal: WritableSignal<PlayerCharacter | null>;
  let travelingSignal: WritableSignal<boolean>;

  const mockLocations: LocationWithNPCCount[] = [
    {
      id: 'home',
      name: 'Home',
      description: 'Your cozy apartment',
      district: 'residential' as District,
      npcCount: 0
    },
    {
      id: 'park',
      name: 'Neighborhood Park',
      description: 'A nice park',
      district: 'residential' as District,
      npcCount: 2
    },
    {
      id: 'coffee_shop',
      name: 'Corner Coffee Shop',
      description: 'A cozy cafe',
      district: 'residential' as District,
      openTime: '06:00',
      closeTime: '22:00',
      npcCount: 1
    },
    {
      id: 'library',
      name: 'Public Library',
      description: 'A quiet library',
      district: 'downtown' as District,
      openTime: '08:00',
      closeTime: '20:00',
      npcCount: 0
    },
    {
      id: 'beach',
      name: 'Beach',
      description: 'Sandy beach',
      district: 'waterfront' as District,
      npcCount: 3
    }
  ];

  const mockPlayer: PlayerCharacter = {
    id: 'player-1',
    userId: 'user-1',
    name: 'Test Player',
    currentDay: 1,
    currentTime: '08:00',
    energy: 100,
    currentLocation: 'home'
  };

  beforeEach(async () => {
    // Initialize mock signals
    locationsSignal = signal<LocationWithNPCCount[]>([]);
    locationsLoadingSignal = signal<boolean>(false);
    playerSignal = signal<PlayerCharacter | null>(mockPlayer);
    travelingSignal = signal<boolean>(false);

    mockFacade = {
      locations: locationsSignal,
      locationsLoading: locationsLoadingSignal,
      player: playerSignal,
      traveling: travelingSignal,
      loadLocations: jest.fn(),
      travel: jest.fn().mockReturnValue(of({ newLocation: 'park', travelTime: 5, arrivedAt: '08:05' })),
      goHome: jest.fn().mockReturnValue(of({ newLocation: 'home', travelTime: 0, arrivedAt: '08:00' }))
    };

    mockRouter = {
      navigate: jest.fn()
    } as any;

    await TestBed.configureTestingModule({
      imports: [LocationSelector],
      providers: [
        { provide: GameFacade, useValue: mockFacade },
        { provide: Router, useValue: mockRouter }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]  // Allow unknown elements (Material components)
    }).compileComponents();

    fixture = TestBed.createComponent(LocationSelector);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load locations on init if locations array is empty', () => {
      locationsSignal.set([]);
      fixture.detectChanges();

      expect(mockFacade.loadLocations).toHaveBeenCalled();
    });

    it('should NOT load locations on init if locations are already loaded', () => {
      locationsSignal.set(mockLocations);
      fixture.detectChanges();

      expect(mockFacade.loadLocations).not.toHaveBeenCalled();
    });
  });

  describe('Location Grouping by District', () => {
    beforeEach(() => {
      locationsSignal.set(mockLocations);
      fixture.detectChanges();
    });

    it('should group locations by district correctly', () => {
      const grouped = component.locationsByDistrict();

      expect(grouped.residential.length).toBe(3);
      expect(grouped.downtown.length).toBe(1);
      expect(grouped.waterfront.length).toBe(1);
    });

    it('should have home, park, and coffee_shop in residential district', () => {
      const grouped = component.locationsByDistrict();
      const residentialIds = grouped.residential.map(loc => loc.id);

      expect(residentialIds).toContain('home');
      expect(residentialIds).toContain('park');
      expect(residentialIds).toContain('coffee_shop');
    });

    it('should have library in downtown district', () => {
      const grouped = component.locationsByDistrict();
      const downtownIds = grouped.downtown.map(loc => loc.id);

      expect(downtownIds).toContain('library');
    });

    it('should have beach in waterfront district', () => {
      const grouped = component.locationsByDistrict();
      const waterfrontIds = grouped.waterfront.map(loc => loc.id);

      expect(waterfrontIds).toContain('beach');
    });

    it('should return empty arrays for districts with no locations', () => {
      locationsSignal.set([mockLocations[0]]); // Only home
      fixture.detectChanges();

      const grouped = component.locationsByDistrict();

      expect(grouped.residential.length).toBe(1);
      expect(grouped.downtown.length).toBe(0);
      expect(grouped.waterfront.length).toBe(0);
    });
  });

  describe('Current Location Detection', () => {
    beforeEach(() => {
      locationsSignal.set(mockLocations);
      fixture.detectChanges();
    });

    it('should correctly identify current location', () => {
      expect(component.isCurrentLocation('home')).toBe(true);
      expect(component.isCurrentLocation('park')).toBe(false);
      expect(component.isCurrentLocation('beach')).toBe(false);
    });

    it('should return false if player is null', () => {
      playerSignal.set(null);
      fixture.detectChanges();

      expect(component.isCurrentLocation('home')).toBe(false);
    });
  });

  describe('Travel Actions', () => {
    beforeEach(() => {
      locationsSignal.set(mockLocations);
      fixture.detectChanges();
    });

    it('should call facade.travel when traveling to a new location', () => {
      component.onTravelTo('park');

      expect(mockFacade.travel).toHaveBeenCalledWith('park');
    });

    it('should navigate to /game after successful travel', (done) => {
      component.onTravelTo('park');

      setTimeout(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/game']);
        done();
      }, 0);
    });

    it('should NOT travel if already at the location', () => {
      component.onTravelTo('home'); // Player is already at home

      expect(mockFacade.travel).not.toHaveBeenCalled();
    });

    it('should call facade.goHome when going home', () => {
      playerSignal.set({ ...mockPlayer, currentLocation: 'park' });
      fixture.detectChanges();

      component.onGoHome();

      expect(mockFacade.goHome).toHaveBeenCalled();
    });

    it('should NOT go home if already at home', () => {
      component.onGoHome(); // Player is already at home

      expect(mockFacade.goHome).not.toHaveBeenCalled();
    });

    it('should handle travel error gracefully', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      (mockFacade.travel as jest.Mock).mockReturnValue(throwError(() => new Error('Travel failed')));

      component.onTravelTo('park');

      expect(alertSpy).toHaveBeenCalledWith('Failed to travel. Please try again.');
      alertSpy.mockRestore();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to /game when onBack is called', () => {
      component.onBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/game']);
    });
  });

  describe('Helper Methods', () => {
    it('should return correct district names', () => {
      expect(component.getDistrictName('residential')).toBe('Residential Quarter');
      expect(component.getDistrictName('downtown')).toBe('Town Center');
      expect(component.getDistrictName('waterfront')).toBe('Waterfront');
    });

    it('should return correct district icons', () => {
      expect(component.getDistrictIcon('residential')).toBe('home_work');
      expect(component.getDistrictIcon('downtown')).toBe('location_city');
      expect(component.getDistrictIcon('waterfront')).toBe('waves');
    });

    it('should return correct location icons', () => {
      expect(component.getLocationIcon('home')).toBe('home');
      expect(component.getLocationIcon('park')).toBe('park');
      expect(component.getLocationIcon('coffee_shop')).toBe('local_cafe');
      expect(component.getLocationIcon('beach')).toBe('beach_access');
      expect(component.getLocationIcon('unknown')).toBe('place');
    });

    it('should return correct location display names', () => {
      expect(component.getLocationDisplayName('home')).toBe('Home');
      expect(component.getLocationDisplayName('coffee_shop')).toBe('Corner Coffee Shop');
      expect(component.getLocationDisplayName('unknown')).toBe('unknown');
    });
  });

  describe('Template Rendering', () => {
    it('should show loading spinner when locationsLoading is true', () => {
      locationsLoadingSignal.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.loading-container')).toBeTruthy();
      expect(compiled.querySelector('mat-spinner')).toBeTruthy();
    });

    it('should show districts when locations are loaded', () => {
      locationsSignal.set(mockLocations);
      locationsLoadingSignal.set(false);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.districts-container')).toBeTruthy();
      expect(compiled.querySelectorAll('.district-card').length).toBe(3);
    });

    it('should show location cards within each district', () => {
      locationsSignal.set(mockLocations);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const locationCards = compiled.querySelectorAll('.location-card');

      // We have 5 mock locations
      expect(locationCards.length).toBe(5);
    });

    it('should show traveling overlay when traveling is true', () => {
      travelingSignal.set(true);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.traveling-overlay')).toBeTruthy();
    });

    it('should display current location info when player is loaded', () => {
      locationsSignal.set(mockLocations);
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.current-location-info')).toBeTruthy();
    });
  });

  describe('Data Flow - Critical Bug Prevention', () => {
    it('should handle locations as an array, not wrapped object', () => {
      // This test guards against the bug where backend returned { locations: [...] }
      // but frontend expected just [...]
      const directArray = mockLocations;
      locationsSignal.set(directArray);
      fixture.detectChanges();

      const grouped = component.locationsByDistrict();

      // If locations were a wrapped object, this would fail
      expect(Array.isArray(grouped.residential)).toBe(true);
      expect(grouped.residential.length).toBeGreaterThan(0);
      expect(grouped.residential[0].id).toBeDefined();
    });

    it('should correctly iterate over locations array', () => {
      locationsSignal.set(mockLocations);
      fixture.detectChanges();

      // Verify the forEach in locationsByDistrict works correctly
      const grouped = component.locationsByDistrict();
      const totalLocations =
        grouped.residential.length +
        grouped.downtown.length +
        grouped.waterfront.length;

      expect(totalLocations).toBe(mockLocations.length);
    });
  });
});
