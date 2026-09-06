import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Share } from '@capacitor/share';

const REMINDER_ID = 2048;

export const isNativeApp = Capacitor.isNativePlatform();

export async function celebrateSave() {
  if (!isNativeApp) return;
  await Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

export async function scheduleDailyReminder(enabled, time = '20:30') {
  if (!isNativeApp) return { native: false };
  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  if (!enabled) return { native: true, enabled: false };

  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== 'granted') {
    throw new Error('Notifications are turned off. Enable them in iOS Settings to use an evening reminder.');
  }
  const [hour, minute] = time.split(':').map(Number);
  await LocalNotifications.schedule({
    notifications: [{
      id: REMINDER_ID,
      title: 'Your golden hour',
      body: 'Take one minute to keep the day.',
      schedule: { on: { hour, minute }, repeats: true },
    }],
  });
  return { native: true, enabled: true };
}

export async function shareApp(url) {
  if (isNativeApp) {
    await Share.share({ title: 'Vibe Check', text: 'A one-minute evening mood check-in.', url, dialogTitle: 'Share Vibe Check' });
    return true;
  }
  if (navigator.share) {
    await navigator.share({ title: 'Vibe Check', text: 'A one-minute evening mood check-in.', url });
    return true;
  }
  return false;
}
