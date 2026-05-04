  type CreateArticleFormProps = {
  blogs: { id: string; title: string }[];
  selectedBlog: string;
  setSelectedBlog: (value: string) => void;
  articleTitle: string;
  setArticleTitle: (value: string) => void;
  content: string;
  setContent: (value: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  preview: string | null;
  loading: boolean;
  articleFetcher: any;
};  

export default function CreateArticleForm({
  blogs,
  selectedBlog,
  setSelectedBlog,
  articleTitle,
  setArticleTitle,
  content,
  setContent,
  file,
  setFile,
  preview,
  loading,
  articleFetcher,
}: CreateArticleFormProps) {
  return (
    <s-stack paddingBlockEnd="large-500">
      <s-stack direction="block" gap="base">
        <s-heading>Create Article</s-heading>
        {/* BLOG SELECT */}
        <s-select
          key={blogs.length}
          label="Select Blog"
          value={selectedBlog}
          onChange={(e: any) =>
            setSelectedBlog(e.target.value || e.detail?.value)
          }
        >
          <s-option value="" disabled>Select Blog</s-option>
          {blogs.map((b: any) => (
            <s-option key={b.id} value={b.id}>
              {b.title}
            </s-option>
          ))}
        </s-select>
        {/* TITLE */}
        <s-text-field
          label="Article Title"
          value={articleTitle}
          onInput={(e: any) => setArticleTitle(e.target.value)}
        />
        {/* CONTENT */}
        <s-text-area
          label="Content"
          value={content}
          onInput={(e: any) => setContent(e.target.value)}
        />
        <s-drop-zone
          label="Upload image"
          accept="image/*"
          onChange={(e: any) => {
            console.log("DROP EVENT:", e);

            const files =
              e.detail?.files || e.target?.files || e.currentTarget?.files;

            if (files && files.length > 0) {
              setFile(files[0]);
            }
          }}
        />
        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{
              width: "150px",
              marginTop: "10px",
              borderRadius: "8px",
            }}
          />
        )}
        {file && <s-text>Selected: {file.name}</s-text>}
        <s-button
          variant="primary"
          loading={loading}
          disabled={
            loading ||
            !selectedBlog ||
            !articleTitle.trim() ||
            !content.trim()
          }
          onClick={() => {
            const fd = new FormData();
            fd.append("type", "article");
            fd.append("blogId", selectedBlog);
            fd.append("title", articleTitle);
            fd.append("content", content);

            if (file) {
              fd.append("file", file);
            }
            articleFetcher.submit(fd, {
              method: "post",
              encType: "multipart/form-data",
            });
          }}
        >
          Create Article
        </s-button>
      </s-stack>
    </s-stack>
  );
}
