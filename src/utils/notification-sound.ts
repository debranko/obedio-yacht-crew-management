/**
 * Notification Sound Utility
 * Generates notification sounds using Web Audio API (no external files needed)
 */

/**
 * Play a pleasant notification sound
 * Creates a two-tone beep using Web Audio API
 */
export function playNotificationSound(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create oscillator for first tone (higher pitch)
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();

    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);

    // Pleasant notification tone (E6 = 1318.51 Hz)
    oscillator1.frequency.value = 1318.51;
    oscillator1.type = 'sine';

    // Envelope for smooth sound
    const now = audioContext.currentTime;
    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
    gainNode1.gain.exponentialRampToValueAtTime(0.01, now + 0.15); // Decay

    oscillator1.start(now);
    oscillator1.stop(now + 0.15);

    // Create oscillator for second tone (lower pitch, after short delay)
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);

    // Lower tone (C6 = 1046.50 Hz)
    oscillator2.frequency.value = 1046.50;
    oscillator2.type = 'sine';

    // Envelope for second tone
    const delay = 0.1;
    gainNode2.gain.setValueAtTime(0, now + delay);
    gainNode2.gain.linearRampToValueAtTime(0.25, now + delay + 0.01);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.2);

    oscillator2.start(now + delay);
    oscillator2.stop(now + delay + 0.2);

    // Cleanup
    setTimeout(() => {
      audioContext.close();
    }, 500);

  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
}

/**
 * Play an emergency alert sound
 * Creates an urgent alternating tone
 */
export function playEmergencySound(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create oscillator for alarm
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Urgent alarm frequencies
    const now = audioContext.currentTime;

    // Alternating high-low tone
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.setValueAtTime(600, now + 0.2);
    oscillator.frequency.setValueAtTime(800, now + 0.4);
    oscillator.frequency.setValueAtTime(600, now + 0.6);
    oscillator.frequency.setValueAtTime(800, now + 0.8);

    oscillator.type = 'square';

    // Louder for emergency
    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.setValueAtTime(0.4, now + 1.0);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    oscillator.start(now);
    oscillator.stop(now + 1.2);

    // Cleanup
    setTimeout(() => {
      audioContext.close();
    }, 1500);

  } catch (error) {
    console.log('Could not play emergency sound:', error);
  }
}
