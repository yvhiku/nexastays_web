"use client";

import React, { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { RotateCw, X } from "lucide-react";
import type { AttachmentEditorProps } from "@/lib/messaging/attachments/registry";
import type { CropArea } from "@/lib/messaging/image-pipeline";

function areaToCrop(area: Area): CropArea {
  return { x: area.x, y: area.y, width: area.width, height: area.height };
}

export function ImageAttachmentEditor({
  item,
  onRemove,
  onCropChange,
  onRotate,
  labels,
}: AttachmentEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback(
    (_: Area, pixels: Area) => {
      setCroppedAreaPixels(pixels);
      onCropChange?.(areaToCrop(pixels), item.rotation);
    },
    [item.rotation, onCropChange],
  );

  return (
    <div className="relative flex h-full flex-col bg-black">
      <div className="relative flex-1 min-h-0">
        <Cropper
          image={item.previewUrl}
          crop={crop}
          zoom={zoom}
          rotation={item.rotation}
          aspect={undefined}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full bg-white/10 p-2 text-white"
          aria-label={labels.remove}
        >
          <X className="h-5 w-5" />
        </button>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-white"
          aria-label={labels.crop}
        />
        <button
          type="button"
          onClick={onRotate}
          className="rounded-full bg-white/10 p-2 text-white"
          aria-label={labels.rotate}
        >
          <RotateCw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
