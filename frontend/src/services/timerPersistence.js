// Timer Persistence Service
// Manages timer state across page navigation and browser refresh

const STORAGE_KEY = 'liveGameTimerState';

class TimerPersistenceService {
    constructor() {
        this.listeners = new Set();
    }

    // Save timer state to localStorage
    saveTimerState(eventId, timerData) {
        try {
            const allTimers = this.getAllTimers();
            allTimers[eventId] = {
                ...timerData,
                lastUpdated: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allTimers));
            
            // Notify listeners
            this.notifyListeners(eventId, timerData);
        } catch (error) {
            console.error('Error saving timer state:', error);
        }
    }

    // Get timer state for a specific event
    getTimerState(eventId) {
        try {
            const allTimers = this.getAllTimers();
            const timerState = allTimers[eventId];
            
            if (!timerState) return null;

            // Calculate elapsed time since last update if timer was running
            if (timerState.is_running) {
                const elapsed = Math.floor((Date.now() - timerState.lastUpdated) / 1000);
                const newTimeRemaining = Math.max(0, timerState.time_remaining - elapsed);
                
                return {
                    ...timerState,
                    time_remaining: newTimeRemaining
                };
            }

            return timerState;
        } catch (error) {
            console.error('Error getting timer state:', error);
            return null;
        }
    }

    // Get all timers
    getAllTimers() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error parsing stored timers:', error);
            return {};
        }
    }

    // Clear timer state for an event (when game ends)
    clearTimerState(eventId) {
        try {
            const allTimers = this.getAllTimers();
            delete allTimers[eventId];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allTimers));
        } catch (error) {
            console.error('Error clearing timer state:', error);
        }
    }

    // Subscribe to timer updates
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    // Notify listeners of timer changes
    notifyListeners(eventId, timerData) {
        this.listeners.forEach(callback => {
            try {
                callback(eventId, timerData);
            } catch (error) {
                console.error('Error in timer listener:', error);
            }
        });
    }

    // Background timer service - keeps timer running even when page is not focused
    startBackgroundTimer(eventId) {
        const intervalId = setInterval(() => {
            const timerState = this.getTimerState(eventId);
            if (!timerState || !timerState.is_running) {
                clearInterval(intervalId);
                return;
            }

            // Update time remaining
            if (timerState.time_remaining > 0) {
                this.saveTimerState(eventId, {
                    ...timerState,
                    time_remaining: timerState.time_remaining - 1
                });
            } else {
                // Timer reached 0
                this.saveTimerState(eventId, {
                    ...timerState,
                    time_remaining: 0,
                    is_running: false
                });
                clearInterval(intervalId);
            }
        }, 1000);

        return intervalId;
    }

    // Check if timer is active for any event (useful for preventing navigation)
    hasActiveTimer() {
        const allTimers = this.getAllTimers();
        return Object.values(allTimers).some(timer => timer.is_running);
    }

    // Get all active timers
    getActiveTimers() {
        const allTimers = this.getAllTimers();
        return Object.entries(allTimers)
            .filter(([_, timer]) => timer.is_running)
            .map(([eventId, timer]) => ({ eventId, ...timer }));
    }
}

// Export singleton instance
export const timerService = new TimerPersistenceService();
export default timerService;
