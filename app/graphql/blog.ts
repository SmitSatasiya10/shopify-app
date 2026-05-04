// app/graphql/blogs.ts

//  Get all blogs
export const BLOG_LIST_QUERY = `#graphql
  query BlogList {
    blogs(first: 50) {
      nodes {
        id
        handle
        title
        updatedAt
        createdAt
        commentPolicy
        templateSuffix
        tags
      }
    }
  }
`;

//  Create Blog
export const CREATE_BLOG_MUTATION = `#graphql
  mutation CreateBlog($blog: BlogCreateInput!) {
    blogCreate(blog: $blog) {
      blog {
        id
        title
        handle
        templateSuffix
        commentPolicy
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Create Article
export const CREATE_ARTICLE_MUTATION = `#graphql
  mutation CreateArticle($article: ArticleCreateInput!) {
    articleCreate(article: $article) {
      article {
        id
        title
        handle
        body
        summary
        tags
        author {
          name
        }
        image {
          altText
          url
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const BLOG_ARTICLES_QUERY = `#graphql
  query BlogArticles($blogId: ID!) {
    blog(id: $blogId) {
      id
      title
      articles(first: 20) {
        nodes {
          id
          title
          handle
          publishedAt
          image {
            url
          }
        }
      }
    }
  }
`;