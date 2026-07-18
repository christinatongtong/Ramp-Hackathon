"use client";

export function UnsupportedScene({ structureType }: { structureType: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-[#7ecbff] p-8 text-center text-slate-800">
      <div>
        <p className="text-lg font-semibold">Unsupported scene</p>
        <p className="mt-2 text-sm opacity-80">
          No renderer for structure type &ldquo;{structureType}&rdquo;.
        </p>
      </div>
    </div>
  );
}
