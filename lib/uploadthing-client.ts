import { generateUploadButton, generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
