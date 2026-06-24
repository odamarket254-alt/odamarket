import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SoundSettingsState {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const useSoundSettings = create<SoundSettingsState>()(
  persist(
    (set) => ({
      soundEnabled: true, // Default to true
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
    }),
    {
      name: "oda-market-sound-settings",
    }
  )
);

export const useMessageSound = () => {
  const soundEnabled = useSoundSettings((state) => state.soundEnabled);

  const playSound = () => {
    if (!soundEnabled) return;
    try {
      const audio = new Audio("https://cdn.freesound.org/previews/415/415082_5121236-lq.mp3");
      audio.volume = 0.5;
      audio.play().catch(e => console.warn("Audio play blocked:", e));
    } catch (error) {
      console.warn("Error playing sound", error);
    }
  };

  return { playSound, soundEnabled };
};
