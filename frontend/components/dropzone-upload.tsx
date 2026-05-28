"use client";

import { useCallback, useRef, useState } from "react";
import { FileSpreadsheet, Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DropZoneUploadProps {
  onFile: (file: File) => void;
  accept?: string;
  busy?: boolean;
  fileName?: string;
}

export function DropZoneUpload({ onFile, accept = ".csv,text/csv", busy = false, fileName }: DropZoneUploadProps) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        handle(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed bg-card px-6 py-10 text-center transition-colors",
        hover ? "border-primary bg-primary/5" : "border-border",
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        {fileName ? <FileSpreadsheet className="h-5 w-5" /> : <UploadIcon className="h-5 w-5" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {fileName ? fileName : "Drop a CSV here, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">
          We never upload your file — validation runs entirely in your browser.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? "Reading…" : fileName ? "Choose a different file" : "Choose CSV"}
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href="/demo/sample.csv" download>
            Download template
          </a>
        </Button>
      </div>
    </div>
  );
}
