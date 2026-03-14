import { CreatePostForm } from "@/components/community/create-post-form";

export default function NewPostPage() {
  return (
    <div>
      <div className="mb-8 animate-fade-up">
        <h1 className="text-2xl font-bold tracking-tight">New Post</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share a progress update or general post with the community
        </p>
      </div>
      <CreatePostForm />
    </div>
  );
}
