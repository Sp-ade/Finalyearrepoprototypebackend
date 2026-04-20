const db = require('../Database');

// Preset tags seeded into the Tags table on every server start.
// ON CONFLICT DO NOTHING makes this idempotent – safe to run repeatedly.
const PRESET_TAGS = [
  // Programming languages
  'python', 'javascript', 'java', 'c++', 'c#', 'typescript', 'kotlin', 'swift', 'go', 'rust',
  // Web
  'react', 'vue', 'angular', 'node.js', 'express', 'next.js', 'html', 'css', 'rest api', 'graphql',
  // Mobile
  'flutter', 'react native', 'android', 'ios',
  // Data / AI
  'machine learning', 'deep learning', 'data science', 'artificial intelligence',
  'computer vision', 'nlp', 'data analysis', 'data visualization', 'tensorflow', 'pytorch',
  // Databases
  'postgresql', 'mysql', 'mongodb', 'firebase', 'sqlite', 'redis',
  // Cloud / DevOps
  'aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'ci/cd', 'linux',
  // Security
  'cybersecurity', 'network security', 'cryptography', 'penetration testing',
  // Other technologies
  'blockchain', 'iot', 'embedded systems', 'robotics', 'ar/vr',
  // Academic areas
  'software engineering', 'web development', 'mobile development', 'cloud computing',
  'human computer interaction', 'database design', 'algorithm design', 'networking',
];

async function seedTags() {
  try {
    let inserted = 0;

    for (const tag of PRESET_TAGS) {
      const res = await db.query(
        `INSERT INTO Tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING tag_id`,
        [tag.toLowerCase().trim()]
      );
      if (res.rows.length > 0) inserted++;
    }

    if (inserted > 0) {
      console.log(`✓ Tags seeded: ${inserted} new tag(s) added`);
    } else {
      console.log('✓ Tags already seeded – no changes needed');
    }
  } catch (error) {
    console.error('❌ Error seeding tags:', error);
    throw error;
  }
}

// Allow running directly:  node scripts/seed-tags.js
if (require.main === module) {
  seedTags()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedTags;
