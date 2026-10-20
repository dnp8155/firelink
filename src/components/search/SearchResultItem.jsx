import React from "react";
import { CommandItem } from "@/components/ui/command";
import { Image } from "@/components/ui/image";
import { getIcon } from "@/lib/icons";

export default function SearchResultItem({ item, onSelect }) {
  const Icon = item.icon ? getIcon(item.icon) : null;

  return (
    <CommandItem value={item.id} onSelect={onSelect} className="gap-2.5">
      {item.image ? (
        <Image src={item.image} alt="" className="h-7 w-7 shrink-0 rounded-md" fittingType="fill" />
      ) : Icon ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <Icon className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">{item.title}</span>
        {item.subtitle ? <span className="block truncate text-xs text-slate-500">{item.subtitle}</span> : null}
      </span>
    </CommandItem>
  );
}