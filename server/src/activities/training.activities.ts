import { TrainingActivity } from '../../../shared/types/activity.types';
import { createTrainingActivity } from './factories';

export const TRAINING_ACTIVITIES: TrainingActivity[] = [
  createTrainingActivity({
    id: 'study_library',
    name: 'Study at Library',
    description: 'Hit the books and expand your knowledge',
    location: 'library',
    timeCost: 120,
    energyCost: -12,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    difficulty: 45,
    relevantStats: ['knowledge'],
    statRequirements: { knowledge: 10 },
    outcomeProfile: {
      mainStats: ['knowledge'],
      mainStatGain: 2.5,
      secondaryStats: ['creativity', 'poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 0.5,
        energyCost: 8
      }
    }
  }),

  createTrainingActivity({
    id: 'work_out_gym',
    name: 'Work Out at Gym',
    description: 'Get a solid workout in at the gym',
    location: 'gym',
    timeCost: 90,
    energyCost: -15,
    moneyCost: -10,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    difficulty: 40,
    relevantStats: ['fitness'],
    outcomeProfile: {
      mainStats: ['fitness'],
      mainStatGain: 3,
      secondaryStats: ['poise', 'confidence'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['confidence'],
        statPenalty: 1,
        energyCost: 10,
        timeCost: 15
      }
    }
  }),

  createTrainingActivity({
    id: 'read_book',
    name: 'Read a Book',
    description: 'Read for pleasure and relaxation',
    location: 'home',
    timeCost: 90,
    energyCost: -5,
    moneyCost: 0,
    difficulty: 25,
    relevantStats: ['knowledge'],
    outcomeProfile: {
      mainStats: ['knowledge'],
      mainStatGain: 2,
      secondaryStats: ['creativity'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['fitness'],
        statPenalty: 0.5,
        timeCost: 15
      }
    }
  }),

  createTrainingActivity({
    id: 'creative_hobby',
    name: 'Practice Creative Hobby',
    description: 'Work on art, music, or creative projects',
    location: 'home',
    timeCost: 120,
    energyCost: -10,
    moneyCost: 0,
    difficulty: 45,
    relevantStats: ['creativity'],
    outcomeProfile: {
      mainStats: ['creativity'],
      mainStatGain: 1.5,
      secondaryStats: ['knowledge', 'poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['fitness', 'confidence'],
        statPenalty: 0.5,
        moneyCost: 5,
        timeCost: 20
      }
    }
  }),

  createTrainingActivity({
    id: 'yoga_practice',
    name: 'Yoga Class',
    description: 'Attend a yoga class to work on flexibility, balance, and mindful movement',
    location: 'gym',
    timeCost: 60,
    energyCost: -12,
    moneyCost: -10,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    difficulty: 35,
    relevantStats: ['poise', 'fitness'],
    outcomeProfile: {
      mainStats: ['poise'],
      mainStatGain: 1.5,
      secondaryStats: ['fitness', 'vitality'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['poise'],
        statPenalty: 0.5,
        energyCost: 5,
        timeCost: 15
      }
    }
  }),

  createTrainingActivity({
    id: 'meditation',
    name: 'Meditate',
    description: 'Practice mindfulness and mental composure',
    location: 'home',
    timeCost: 45,
    energyCost: 0,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening', 'night'],
    difficulty: 25,
    relevantStats: ['poise'],
    outcomeProfile: {
      mainStats: ['poise'],
      mainStatGain: 1.0,
      secondaryStats: ['vitality'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        timeCost: 15
      }
    }
  }),

  createTrainingActivity({
    id: 'stretching',
    name: 'Stretching Routine',
    description: 'Improve flexibility and body awareness',
    location: 'home',
    timeCost: 30,
    energyCost: -5,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    difficulty: 20,
    relevantStats: ['poise', 'fitness'],
    outcomeProfile: {
      mainStats: ['poise'],
      mainStatGain: 1.0,
      secondaryStats: ['fitness'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        stats: ['fitness'],
        statPenalty: 0.3,
        energyCost: 3
      }
    }
  }),

  createTrainingActivity({
    id: 'journaling',
    name: 'Write in Journal',
    description: 'Express thoughts and ideas through writing',
    location: 'home',
    timeCost: 60,
    energyCost: -8,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening', 'night'],
    difficulty: 30,
    relevantStats: ['creativity'],
    outcomeProfile: {
      mainStats: ['creativity'],
      mainStatGain: 1.0,
      secondaryStats: ['knowledge', 'wit'],
      secondaryStatGain: 0.3,
      negativeEffects: {
        energyCost: 5,
        timeCost: 20
      }
    }
  }),

  createTrainingActivity({
    id: 'sketching',
    name: 'Sketch/Draw',
    description: 'Practice visual art and creative observation',
    location: 'park',
    timeCost: 75,
    energyCost: -8,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    difficulty: 35,
    relevantStats: ['creativity'],
    outcomeProfile: {
      mainStats: ['creativity'],
      mainStatGain: 1.2,
      secondaryStats: ['poise', 'knowledge'],
      secondaryStatGain: 0.4,
      negativeEffects: {
        stats: ['creativity'],
        statPenalty: 0.5,
        energyCost: 5,
        timeCost: 15
      }
    }
  }),

  createTrainingActivity({
    id: 'morning_jog',
    name: 'Morning Jog',
    description: 'Go for an energizing run outdoors',
    location: 'park',
    timeCost: 45,
    energyCost: -10,
    moneyCost: 0,
    allowedTimeSlots: ['morning'],
    difficulty: 30,
    relevantStats: ['fitness'],
    outcomeProfile: {
      mainStats: ['fitness'],
      mainStatGain: 3,
      secondaryStats: ['poise'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['fitness'],
        statPenalty: 0.5,
        energyCost: 5,
        timeCost: 10
      }
    }
  }),

  createTrainingActivity({
    id: 'swim_beach',
    name: 'Swim at Beach',
    description: 'Take a refreshing swim in the ocean',
    location: 'beach',
    timeCost: 60,
    energyCost: -12,
    moneyCost: 0,
    allowedTimeSlots: ['morning', 'afternoon', 'evening'],
    difficulty: 40,
    relevantStats: ['fitness'],
    outcomeProfile: {
      mainStats: ['fitness'],
      mainStatGain: 3,
      secondaryStats: ['poise', 'confidence'],
      secondaryStatGain: 0.5,
      negativeEffects: {
        stats: ['fitness'],
        statPenalty: 0.5,
        energyCost: 8,
        timeCost: 15
      }
    }
  })
];
