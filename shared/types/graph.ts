export interface GraphNode {
  id: string;
  slug: string;
  title: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface PostGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphPost {
  id: string;
  slug: string;
  title: string;
  content?: unknown;
}

const INTERNAL_LINK = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;

export function buildPostGraph(posts: GraphPost[]): PostGraph {
  const nodes = posts
    .map(({ id, slug, title }) => ({ id, slug, title: title || "Untitled" }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const bySlug = new Map(nodes.map((node) => [node.slug, node]));
  const edgeSet = new Set<string>();

  for (const post of posts) {
    const source = bySlug.get(post.slug);
    if (!source) {continue;}
    const text =
      typeof post.content === "string"
        ? post.content
        : JSON.stringify(post.content ?? "");
    for (const match of text.matchAll(INTERNAL_LINK)) {
      const target = bySlug.get(match[1]?.trim() || "");
      if (target && target.id !== source.id)
        {edgeSet.add(`${source.id}:${target.id}`);}
    }
  }

  return {
    nodes,
    edges: [...edgeSet]
      .map((key) => {
        const [source, target] = key.split(":");
        return { source: source || "", target: target || "" };
      })
      .sort((a, b) =>
        `${a.source}:${a.target}`.localeCompare(`${b.source}:${b.target}`)
      ),
  };
}
