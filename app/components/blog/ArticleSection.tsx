import { useState, useMemo, useEffect } from "react";

type ArticleSectionProps = {
  selectedBlog: string;
  setSelectedBlog: (value: string) => void;
  blogs: { id: string; title: string }[];
  articles: any[];
  articlesLoading: boolean;

  onEdit: (article: any) => void;
  onDelete: (id: string) => Promise<void>;
};

export default function ArticleSection({
  selectedBlog,
  setSelectedBlog,
  blogs,
  articles,
  articlesLoading,
  onEdit,
  onDelete,
}: ArticleSectionProps) {
  const selectedTitle = blogs.find((b) => b.id === selectedBlog)?.title;

  const [search, setSearch] = useState("");

  // pagination state
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [search, selectedBlog]);

  // search filter
  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles;

    return articles.filter((a) =>
      a.title.toLowerCase().includes(search.toLowerCase()),
    );
  }, [articles, search]);

  // pagination logic
  const paginatedArticles = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return filteredArticles.slice(start, end);
  }, [filteredArticles, page]);

  const totalPages = Math.ceil(filteredArticles.length / pageSize);

  return (
    <>
      {/* HEADER */}
      <s-heading>Article List</s-heading>

      {/* FILTER BAR */}
      <s-stack
        direction="inline"
        justifyContent="space-between"
        alignItems="center"
        padding="base"
      >
        {/* SEARCH */}
        <s-stack direction="block">
          <s-text-field
            placeholder="Search articles..."
            icon="search"
            autocomplete="off"
            value={search}
            onInput={(e: any) => setSearch(e.target.value)}
          />
        </s-stack>

        {/* BLOG FILTER */}
        <s-button commandFor="blog-filter-popover" variant="primary">
          {selectedBlog ? selectedTitle : "All Articles"}
        </s-button>

        <s-popover id="blog-filter-popover">
          <s-stack direction="block" gap="base">
            <s-button variant="tertiary" onClick={() => setSelectedBlog("")}>
              All Articles
            </s-button>

            {blogs.map((b) => (
              <s-button
                key={b.id}
                variant={selectedBlog === b.id ? "primary" : "tertiary"}
                onClick={() => setSelectedBlog(b.id)}
              >
                {b.title}
              </s-button>
            ))}
          </s-stack>
        </s-popover>
      </s-stack>

      <s-section padding="none" accessibilityLabel="Articles table">
        <s-table>
          <s-table-header-row>
            <s-table-header listSlot="primary">Article</s-table-header>
            {/* <s-table-header>Content</s-table-header> */}
            <s-table-header>Created</s-table-header>
            <s-table-header listSlot="secondary">Status</s-table-header>
            <s-table-header listSlot="secondary">Actions</s-table-header>
          </s-table-header-row>

          <s-table-body>
            {/* 🔄 LOADING */}
            {articlesLoading && (
              <s-table-row>
                <s-table-cell>
                  <s-text>Loading articles...</s-text>
                </s-table-cell>
              </s-table-row>
            )}

            {/* ❌ EMPTY */}
            {!articlesLoading && paginatedArticles.length === 0 && (
              <s-table-row>
                <s-table-cell>
                  <s-text>No articles found</s-text>
                </s-table-cell>
              </s-table-row>
            )}

            {/* ✅ DATA */}
            {!articlesLoading &&
              paginatedArticles.map((a: any) => (
                <s-table-row key={a.id}>
                  {/* COLUMN 1 */}
                  <s-table-cell>
                    <s-stack direction="inline" gap="small" alignItems="center">
                      <s-checkbox id={`checkbox-${a.id}`} />

                      {a.image?.url ? (
                        <s-clickable
                          border="base"
                          borderRadius="base"
                          overflow="hidden"
                          inlineSize="40px"
                          blockSize="40px"
                        >
                          <s-image objectFit="cover" src={a.image.url} />
                        </s-clickable>
                      ) : (
                        <s-text>-</s-text>
                      )}

                      <s-text>{a.title}</s-text>
                    </s-stack>
                  </s-table-cell>

                  {/* COLUMN 2 (Created) */}
                  <s-table-cell>
                    {a.publishedAt
                      ? new Date(a.publishedAt).toLocaleDateString()
                      : "—"}
                  </s-table-cell>

                  {/* COLUMN 3 (Status) */}
                  <s-table-cell>
                    <s-badge tone={a.publishedAt ? "success" : "neutral"}>
                      {a.publishedAt ? "Published" : "Draft"}
                    </s-badge>
                  </s-table-cell>

                  {/* COLUMN 4 (Actions) */}
                  <s-table-cell>
                    <s-stack direction="inline" gap="small">
                      <s-button variant="secondary" onClick={() => onEdit(a)}>
                        Edit
                      </s-button>

                      <s-button
                        tone="critical"
                        onClick={async () => {
                          if (confirm("Delete this article?")) {
                            await onDelete(a.id);
                          }
                        }}
                      >
                        Delete
                      </s-button>
                    </s-stack>
                  </s-table-cell>
                </s-table-row>
              ))}
          </s-table-body>
        </s-table>

        {!articlesLoading && filteredArticles.length > 0 && (
          <s-stack
            direction="inline"
            alignItems="center"
            justifyContent="center"
            gap="base"
            // style={{ padding: "12px" }}
          >
            <s-button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </s-button>

            <s-text>
              Page {page} of {totalPages || 1}
            </s-text>

            <s-button
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </s-button>
          </s-stack>
        )}
      </s-section>
    </>
  );
}
