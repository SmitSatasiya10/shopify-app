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
    const blogId = formData.get("blogId");
    const title = formData.get("title");
    const content = formData.get("content");

    const file = formData.get("file") as File | null;

    console.log("SERVER FILE:", file);
    console.log("FILE SIZE:", file?.size);

    let uploadedImageUrl = null;

    // NOW file is available
    if (file instanceof File && file.size > 0) {
      uploadedImageUrl = await uploadImageToShopify(admin, file);
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
    console.log("sSDDFEF:", {
      blogId,
      title,
      uploadedImageUrl,
    });

    return new Response(JSON.stringify(await response.json()), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 👉 Get Articles by Blog
  if (type === "getArticles") {
    const blogIdRaw = formData.get("blogId");

    const blogId = typeof blogIdRaw === "string" ? blogIdRaw.trim() : "";

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
  const [selectedBlog, setSelectedBlog] = useState("");
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
    if (!selectedBlog) {
      setArticles([]);
      return;
    }

    const fd = new FormData();
    fd.append("type", "getArticles");
    fd.append("blogId", selectedBlog);

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

  return (
    <s-page heading="Blog Management">
      <s-section>
        <s-stack direction="block" gap="large">
          {/* CREATE BLOG - List Blog*/}
          <BlogManager
            blogs={blogs}
            blogTitle={blogTitle}
            setBlogTitle={setBlogTitle}
            blogFetcher={blogFetcher}
            loading={blogLoading}
          />

          {/* CREATE ARTICLE */}
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
          />
        </s-stack>

        <ArticleSection
          selectedBlog={selectedBlog}
          setSelectedBlog={setSelectedBlog}
          blogs={blogs}
          articles={articles}
          articlesLoading={articlesLoading}
        />
      </s-section>
    </s-page>
  );
}
