'use client';

import { useState, useCallback } from 'react';
import { Tutorial, TutorialStep } from './types';

export function useTutorial(initialTutorial: Tutorial) {
  const [tutorial, setTutorial] = useState<Tutorial>(initialTutorial);

  const nextStep = useCallback(() => {
    setTutorial(prev => {
      if (prev.currentStep >= prev.totalSteps - 1) {
        return prev;
      }

      const newSteps = [...prev.steps];
      newSteps[prev.currentStep] = {
        ...newSteps[prev.currentStep],
        completed: true
      };

      return {
        ...prev,
        currentStep: prev.currentStep + 1,
        steps: newSteps
      };
    });
  }, []);

  const previousStep = useCallback(() => {
    setTutorial(prev => {
      if (prev.currentStep <= 0) {
        return prev;
      }

      return {
        ...prev,
        currentStep: prev.currentStep - 1
      };
    });
  }, []);

  const skipStep = useCallback(() => {
    setTutorial(prev => {
      if (prev.currentStep >= prev.totalSteps - 1) {
        return prev;
      }

      return {
        ...prev,
        currentStep: prev.currentStep + 1
      };
    });
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    setTutorial(prev => {
      if (stepIndex < 0 || stepIndex >= prev.totalSteps) {
        return prev;
      }

      return {
        ...prev,
        currentStep: stepIndex
      };
    });
  }, []);

  const markStepCompleted = useCallback((stepIndex: number) => {
    setTutorial(prev => {
      const newSteps = [...prev.steps];
      if (newSteps[stepIndex]) {
        newSteps[stepIndex] = {
          ...newSteps[stepIndex],
          completed: true
        };
      }

      return {
        ...prev,
        steps: newSteps
      };
    });
  }, []);

  const resetTutorial = useCallback(() => {
    setTutorial(prev => ({
      ...prev,
      currentStep: 0,
      steps: prev.steps.map(step => ({
        ...step,
        completed: false
      }))
    }));
  }, []);

  const completeTutorial = useCallback(() => {
    setTutorial(prev => ({
      ...prev,
      isActive: false,
      steps: prev.steps.map(step => ({
        ...step,
        completed: true
      }))
    }));
  }, []);

  const startTutorial = useCallback(() => {
    setTutorial(prev => ({
      ...prev,
      isActive: true
    }));
  }, []);

  const stopTutorial = useCallback(() => {
    setTutorial(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  return {
    tutorial,
    nextStep,
    previousStep,
    skipStep,
    goToStep,
    markStepCompleted,
    resetTutorial,
    completeTutorial,
    startTutorial,
    stopTutorial,
    setTutorial
  };
} 