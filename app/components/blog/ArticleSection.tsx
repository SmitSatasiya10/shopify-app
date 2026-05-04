type ArticleSectionProps = {
  selectedBlog: string;
  setSelectedBlog: (value: string) => void;
  blogs: { id: string; title: string }[];
  articles: any[];
  articlesLoading: boolean;
};

export default function ArticleSection({
  selectedBlog,
  setSelectedBlog,
  blogs,
  articles,
  articlesLoading,
}: ArticleSectionProps) {
  const selectedTitle =
    blogs.find((b) => b.id === selectedBlog)?.title;

  return (
    <>
      {/* FILTER DROPDOWN TRIGGER */}
      <s-heading>
        Article List
      </s-heading>

      <s-button commandFor="blog-filter-popover" variant="primary">
        {selectedBlog ? selectedTitle : "All Articles"}
      </s-button>

      {/* POPUP MENU */}
      <s-popover id="blog-filter-popover">
        <s-stack direction="block" gap="base">
          <s-button
            variant="tertiary"
            onClick={() => setSelectedBlog("")}
          >
            All Articles
          </s-button>

          {blogs.map((b) => (
            <s-button
              key={b.id}
              variant={
                selectedBlog === b.id ? "primary" : "tertiary"
              }
              onClick={() => setSelectedBlog(b.id)}
            >
              {b.title}
            </s-button>
          ))}
        </s-stack>
      </s-popover>

      {/* ARTICLES LIST */}
      <s-stack>
        {!selectedBlog && (
          <s-text>Select a blog to view articles</s-text>
        )}

        {selectedBlog && articlesLoading && (
          <s-text>Loading articles...</s-text>
        )}

        {selectedBlog &&
          !articlesLoading &&
          articles.length === 0 && (
            <s-text>No articles found</s-text>
          )}

        {!articlesLoading && articles.length > 0 && (
          <s-table>
            <s-table-header-row>
              <s-table-header>Title</s-table-header>
              <s-table-header>Image</s-table-header>
              <s-table-header>Status</s-table-header>
            </s-table-header-row>

            <s-table-body>
              {articles.map((a: any) => (
                <s-table-row key={a.id}>
                  <s-table-cell>{a.title}</s-table-cell>

                  <s-table-cell>
                    {a.image?.url ? (
                      <img
                        src={a.image.url}
                        width="60"
                        style={{ borderRadius: "6px" }}
                      />
                    ) : (
                      <s-text>-</s-text>
                    )}
                  </s-table-cell>

                  <s-table-cell>
                    {a.publishedAt ? "Published" : "Draft"}
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-stack>
    </>
  );
}