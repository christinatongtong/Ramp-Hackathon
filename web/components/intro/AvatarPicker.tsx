"use client";

import { AVATARS, type AvatarId } from "@/lib/avatar/presets";
import { useAvatar } from "@/components/providers/AvatarProvider";

type AvatarPickerProps = {
  visible: boolean;
};

export function AvatarPicker({ visible }: AvatarPickerProps) {
  const { avatarId, setAvatarId } = useAvatar();

  return (
    <div className={`avatar-picker ${visible ? "avatar-picker--visible" : ""}`}>
      <p className="avatar-picker__title">Pick your runner</p>
      <div className="avatar-picker__grid">
        {AVATARS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`avatar-picker__option ${
              avatarId === preset.id ? "avatar-picker__option--active" : ""
            }`}
            onClick={() => setAvatarId(preset.id as AvatarId)}
            title={preset.name}
          >
            <span
              className="avatar-picker__swatch"
              style={{ background: preset.swatch }}
            />
            <span className="avatar-picker__mini-body" style={{ background: preset.bodyColor }} />
            <span className="avatar-picker__mini-head" style={{ background: preset.skinColor }} />
            <span className="avatar-picker__name">{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
