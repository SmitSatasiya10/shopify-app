type Blog = {
  id: string;
  title: string;
  handle: string;
};

type BlogManagerProps = {
  blogs: Blog[];
  blogTitle: string;
  setBlogTitle: (value: string) => void;
  blogFetcher: any;
  loading: boolean;
};

export default function BlogManager({
  blogs,
  blogTitle,
  setBlogTitle,
  blogFetcher,
  loading,
}: BlogManagerProps) {
  return (
    <s-stack direction="block" gap="large">
      {/* CREATE BLOG */}
      <s-stack>
        <s-stack direction="block" gap="base">
          <s-heading>Create Blog</s-heading>

          <s-text-field
            label="Blog Title"
            autocomplete="off"
            value={blogTitle}
            onInput={(e: any) => setBlogTitle(e.target.value)}
          />

          <s-button
            variant="primary"
            loading={loading}
            disabled={!blogTitle.trim()}
            onClick={() => {
              const fd = new FormData();
              fd.append("type", "blog");
              fd.append("title", blogTitle);

              blogFetcher.submit(fd, { method: "post" });
            }}
          >
            Create Blog
          </s-button>
        </s-stack>
      </s-stack>

      {/* BLOG LIST */}
      <s-stack>
        <s-heading>All Blogs</s-heading>

        <s-table>
          <s-table-header-row>
            <s-table-header>Title</s-table-header>
            <s-table-header>Handle</s-table-header>
          </s-table-header-row>

          <s-table-body>
            {blogs.map((b) => (
              <s-table-row key={b.id}>
                <s-table-cell>{b.title}</s-table-cell>
                <s-table-cell>{b.handle}</s-table-cell>
              </s-table-row>
            ))}
          </s-table-body>
        </s-table>
      </s-stack>
    </s-stack>
  );
}