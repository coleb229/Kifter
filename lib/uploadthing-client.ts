import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

export const UploadButton = generateUploadButton<OurFileRouter>();
