"use client";

import {
  MultiFileDropzone,
  type FileState,
} from "@/components/multi-file-dropzone";
import { useEdgeStore } from "@/lib/edgestore";
import { useState } from "react";

export default function Page() {
  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const { edgestore } = useEdgeStore();

  function updateFileProgress(key: string, progress: FileState["progress"]) {
    setFileStates((fileStates) => {
      const newFileStates = structuredClone(fileStates);
      const fileState = newFileStates.find(
        (fileState) => fileState.key === key
      );
      if (fileState) {
        fileState.progress = progress;
      }
      return newFileStates;
    });
  }

  if (isSubmitted) {
    return <div className="flex flex-col items-center m-6">COMPLETE!!!</div>;
  }
  if (isCancelled) {
    return <div className="flex flex-col items-center m-6">CANCELLED!!!</div>;
  }

  return (
    <div className="flex flex-col items-center m-6">
      <div className="flex gap-4">
        <MultiFileDropzone
          value={fileStates}
          onChange={(files) => {
            setFileStates(files);
          }}
          onFilesAdded={async (addedFiles) => {
            setFileStates([...fileStates, ...addedFiles]);
            await Promise.all(
              addedFiles.map(async (addedFileState) => {
                try {
                  const res = await edgestore.myProtectedFiles.upload({
                    file: addedFileState.file,
                    options: {
                      temporary: true,
                    },
                    onProgressChange: async (progress) => {
                      updateFileProgress(addedFileState.key, progress);
                      if (progress === 100) {
                        // wait 1 second to set it to complete
                        // so that the user can see the progress bar at 100%
                        await new Promise((resolve) =>
                          setTimeout(resolve, 1000)
                        );
                        updateFileProgress(addedFileState.key, "COMPLETE");
                      }
                    },
                  });
                  setUrls((prev) => [...prev, res.url]);
                } catch (err) {
                  updateFileProgress(addedFileState.key, "ERROR");
                }
              })
            );
          }}
        />
        {/* Just a dummy form for demo purposes */}
        <div className="flex flex-col gap-2">
          <div>Name</div>
          <TextField />
          <div>Description</div>
          <TextField />
          <div>Tags</div>
          <TextField />
          <div className="flex justify-end mt-2 gap-2">
            <button
              className="bg-white text-black rounded px-3 py-1 hover:opacity-80"
              onClick={() => {
                setIsCancelled(true);
              }}
            >
              Cancel
            </button>
            <button
              className="bg-white text-black rounded px-3 py-1 hover:opacity-80"
              onClick={async () => {
                for (const url of urls) {
                  await edgestore.myProtectedFiles.confirmUpload({
                    url,
                  });
                }
                setIsSubmitted(true);
              }}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TextField(props: {
  name?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <input
      type="text"
      name={props.name}
      className="bg-zinc-900 border border-zinc-600 rounded px-2 py-1"
      onChange={(e) => props.onChange?.(e.target.value)}
    />
  );
}
