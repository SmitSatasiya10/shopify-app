import { useLoaderData, useFetcher } from "react-router";
import { useEffect, useState } from "react";
import { authenticate } from "../shopify.server";
import { uploadImageToShopify } from "../utils/shopify-upload.server";
import CreateArticleForm from "../components/blog/CreateArticleForm";

import {
  BLOG_LIST_QUERY,
  CREATE_BLOG_MUTATION,
  CREATE_ARTICLE_MUTATION,
  BLOG_ARTICLES_QUERY,
} from "../graphql/blog";
import BlogManager from "app/components/blog/BlogManager";
import ArticleSection from "app/components/blog/ArticleSection";

type Blog = {
  id: string;
  title: string;
  handle: string;
};
// ----------------------
// LOADER
// ----------------------
export const loader = async ({ request }: any) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(BLOG_LIST_QUERY);
  const data = await response.json();

  return new Response(
    JSON.stringify({
      blogs: data.data.blogs.nodes,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};

// ----------------------
// ACTION
// ----------------------
export const action = async ({ request }: any) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const type = formData.get("type");

  // 👉 Create Blog
  if (type === "blog") {
    const title = formData.get("title");

    const response = await admin.graphql(CREATE_BLOG_MUTATION, {
      variables: {
        blog: { title },
      },
    });

    return new Response(JSON.stringify(await response.json()), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 👉 Create Article
  if (type === "article") {
    const id = formData.get("id");
    const blogId = formData.get("blogId");
    const title = formData.get("title");
    const content = formData.get("content");

    const file = formData.get("file") as File | null;
    let uploadedImageUrl = null;

    // NOW file is available
    if (file instanceof File && file.size > 0) {
      uploadedImageUrl = await uploadImageToShopify(admin, file);
    }

    if (id) {
      const response = await admin.graphql(
        `
    mutation articleUpdate($id: ID!, $article: ArticleUpdateInput!) {
      articleUpdate(id: $id, article: $article) {
        article {
          id
          title
        }
        userErrors {
          field
          message
        }
      }
    }
    `,
        {
          variables: {
            id,
            article: {
              title,
              body: content,
              // optional but better
              ...(uploadedImageUrl && {
                image: {
                  url: uploadedImageUrl,
                  altText: title,
                },
              }),
            },
          },
        },
      );

      return new Response(JSON.stringify(await response.json()), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // STEP 3: create article
    const response = await admin.graphql(CREATE_ARTICLE_MUTATION, {
      variables: {
        article: {
          blogId,
          title,
          body: content,
          author: {
            name: "Admin",
          },
          image: uploadedImageUrl
            ? {
                url: uploadedImageUrl,
                altText: title,
              }
            : null,
        },
      },
    });

    return new Response(JSON.stringify(await response.json()), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 👉 Get Articles by Blog
  if (type === "getArticles") {
    const blogIdRaw = formData.get("blogId");

    const blogId =
      typeof blogIdRaw === "string" && blogIdRaw.trim().length > 0
        ? blogIdRaw.trim()
        : null;

    if (blogId) {
      const response = await admin.graphql(BLOG_ARTICLES_QUERY, {
        variables: { blogId },
      });

      const data = await response.json();

      return new Response(
        JSON.stringify({
          articles: data.data.blog.articles.nodes,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // 👉 IF no blog → get ALL articles
    const response = await admin.graphql(`
    query {
      articles(first: 50) {
        nodes {
          id
          title
          publishedAt
          image {
            url
          }
        }
      }
    }
  `);

    const data = await response.json();

    return new Response(
      JSON.stringify({
        articles: data.data.articles.nodes,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // 👉 DELETE ARTICLE
  if (type === "deleteArticle") {
    const id = formData.get("id");

    const response = await admin.graphql(`
    mutation {
      articleDelete(id: "${id}") {
        deletedArticleId
        userErrors {
          field
          message
        }
      }
    }
  `);

    return new Response(JSON.stringify(await response.json()), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid action" }), {
    status: 400,
  });
};

// ----------------------
// COMPONENT
// ----------------------
export default function BlogPage() {
  const loaderData = useLoaderData() as { blogs: Blog[] };
  const [blogs, setBlogs] = useState<Blog[]>(loaderData.blogs);

  const blogFetcher = useFetcher();
  const articleFetcher = useFetcher();

  const blogLoading = blogFetcher.state !== "idle";
  const articleLoading = articleFetcher.state !== "idle";

  const [articles, setArticles] = useState<any[]>([]);
  const articlesFetcher = useFetcher();

  const [blogTitle, setBlogTitle] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedBlog, setSelectedBlog] = useState(
    loaderData.blogs?.[0]?.id || "",
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    setBlogs(loaderData.blogs);
  }, [loaderData.blogs]);

  useEffect(() => {
    if (blogFetcher.state === "idle" && blogFetcher.data) {
      const newBlog = blogFetcher.data?.data?.blogCreate?.blog;

      if (newBlog) {
        setBlogs((prev: any) => {
          const exists = prev.find((b: any) => b.id === newBlog.id);
          if (exists) return prev;
          return [newBlog, ...prev];
        });
        setSelectedBlog(newBlog.id);
        setBlogTitle("");
      }
    }
  }, [blogFetcher.state]);

  useEffect(() => {
    if (articleFetcher.state === "idle" && articleFetcher.data) {
      setArticleTitle("");
      setContent("");
      setFile(null);

      if (selectedBlog) {
        const fd = new FormData();
        fd.append("type", "getArticles");
        fd.append("blogId", selectedBlog);
        articlesFetcher.submit(fd, { method: "post" });
      }
    }
  }, [articleFetcher.state, articleFetcher.data]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const fd = new FormData();
    fd.append("type", "getArticles");

    if (selectedBlog) {
      fd.append("blogId", selectedBlog);
    }

    setArticles([]);
    articlesFetcher.submit(fd, { method: "post" });
  }, [selectedBlog]);

  const articlesLoading = articlesFetcher.state !== "idle";

  useEffect(() => {
    if (articlesFetcher.data?.articles) {
      setArticles(articlesFetcher.data.articles);
    }
  }, [articlesFetcher.data]);

  useEffect(() => {
    const fd = new FormData();
    fd.append("type", "getArticles");

    articlesFetcher.submit(fd, { method: "post" });
  }, []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<any>(null);

  const handleDeleteArticle = async (id: string) => {
    const fd = new FormData();
    fd.append("type", "deleteArticle");
    fd.append("id", id);

    await articleFetcher.submit(fd, { method: "post" });

    // refresh list
    const refreshFd = new FormData();
    refreshFd.append("type", "getArticles");

    if (selectedBlog) {
      refreshFd.append("blogId", selectedBlog);
    }

    articlesFetcher.submit(refreshFd, { method: "post" });
  };

  const handleEditArticle = (article: any) => {
    setArticleTitle(article.title);
    setContent(article.bodyHtml || "");
    setSelectedBlog(article.blogId);

    setEditingId(article.id);

    setOriginalData({
      blogId: article.blogId,
      title: article.title,
      content: article.bodyHtml || "",
    });
  };

  return (
    <s-page heading="Blog Management">
      {/* BLOG SECTION */}
      <s-section>
        <s-stack direction="block" gap="large">
          <BlogManager
            blogs={blogs}
            blogTitle={blogTitle}
            setBlogTitle={setBlogTitle}
            blogFetcher={blogFetcher}
            loading={blogLoading}
          />
        </s-stack>
      </s-section>

      <s-stack direction="block" gap="large-500" />

      {/* ARTICLE SECTION */}
      <s-section>
        <s-stack direction="block" gap="large">
          <CreateArticleForm
            blogs={blogs}
            selectedBlog={selectedBlog}
            setSelectedBlog={setSelectedBlog}
            articleTitle={articleTitle}
            setArticleTitle={setArticleTitle}
            content={content}
            setContent={setContent}
            file={file}
            setFile={setFile}
            preview={preview}
            loading={articleLoading}
            articleFetcher={articleFetcher}
            editingId={editingId}
            originalData={originalData}
          />

          <ArticleSection
            selectedBlog={selectedBlog}
            setSelectedBlog={setSelectedBlog}
            blogs={blogs}
            articles={articles}
            articlesLoading={articlesLoading}
            onEdit={handleEditArticle}
            onDelete={handleDeleteArticle}
          />
        </s-stack>
      </s-section>
    </s-page>
  );
}
