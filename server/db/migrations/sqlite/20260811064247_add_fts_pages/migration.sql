-- FTS5 Virtual Table & Triggers for pages
CREATE VIRTUAL TABLE IF NOT EXISTS pages_fts USING fts5(
  id UNINDEXED,
  title,
  content
);

INSERT INTO pages_fts(id, title, content)
SELECT id, title, CAST(content AS TEXT) FROM pages;

CREATE TRIGGER IF NOT EXISTS pages_fts_ai AFTER INSERT ON pages BEGIN
  INSERT INTO pages_fts(id, title, content)
  VALUES (new.id, new.title, CAST(new.content AS TEXT));
END;

CREATE TRIGGER IF NOT EXISTS pages_fts_ad AFTER DELETE ON pages BEGIN
  DELETE FROM pages_fts WHERE id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS pages_fts_au AFTER UPDATE ON pages BEGIN
  DELETE FROM pages_fts WHERE id = old.id;
  INSERT INTO pages_fts(id, title, content)
  VALUES (new.id, new.title, CAST(new.content AS TEXT));
END;