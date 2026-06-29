import Phaser from 'phaser';

class EventBus extends Phaser.Events.EventEmitter {
  constructor() {
    super();
  }
}

export const eventBus = new EventBus();

// Definisi Konstanta Event
export const EVENTS = {
  // System Events
  BOOT_COMPLETE: 'BOOT_COMPLETE',
  SHOW_MAIN_MENU: 'SHOW_MAIN_MENU',
  START_GAME: 'START_GAME',
  TIME_TICK: 'TIME_TICK',
  
  // Game state & Branch events
  CASH_CHANGED: 'CASH_CHANGED',
  STOCK_CHANGED: 'STOCK_CHANGED',
  BRANCH_CREATED: 'BRANCH_CREATED',
  
  // Employee events
  EMPLOYEE_HIRED: 'EMPLOYEE_HIRED',
  EMPLOYEE_STATE_CHANGED: 'EMPLOYEE_STATE_CHANGED',
  KPI_UPDATED: 'KPI_UPDATED'
} as const;
