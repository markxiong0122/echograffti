-- EchoGraffiti database schema
CREATE TABLE graffiti (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt     TEXT NOT NULL,
  image_url  TEXT NOT NULL,
  latitude   FLOAT8 NOT NULL,
  longitude  FLOAT8 NOT NULL,
  creator    TEXT DEFAULT 'Anonymous',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for location-based queries (bounding box)
CREATE INDEX idx_graffiti_location ON graffiti (latitude, longitude);

-- RLS: public read + insert, no auth required
ALTER TABLE graffiti ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read" ON graffiti FOR SELECT USING (true);
CREATE POLICY "Anyone can create" ON graffiti FOR INSERT WITH CHECK (true);

-- Storage bucket for generated images
INSERT INTO storage.buckets (id, name, public) VALUES ('graffiti-images', 'graffiti-images', true);
CREATE POLICY "Public read graffiti images" ON storage.objects FOR SELECT USING (bucket_id = 'graffiti-images');
CREATE POLICY "Public upload graffiti images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'graffiti-images');
