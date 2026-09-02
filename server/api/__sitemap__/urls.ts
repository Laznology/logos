import { postService } from "~~/server/services/posts.service";

export default defineSitemapEventHandler(async () => {
  const posts = await postService.listPublicPosts();

  return posts.map((post) => ({
    loc: `/posts/${post.slug}`,
    lastmod: post.updatedAt,
  }));
});
