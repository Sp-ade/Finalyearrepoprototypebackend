const fs = require('fs').promises;
const path = require('path');
const db = require('../Database');
const projectService = require('../services/projectService');

async function migrateJsonToDb() {
    try {
        console.log('Starting migration from Projects.json to database...\n');

        // Read the JSON file
        const jsonPath = path.join(__dirname, '..', 'nilefinalyearrepo', 'src', 'Projects.json');
        console.log(`Reading from: ${jsonPath}`);

        const rawData = await fs.readFile(jsonPath, 'utf8');
        const data = JSON.parse(rawData);
        const projects = data.projects || [];

        console.log(`Found ${projects.length} projects to migrate\n`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Migrate each project
        for (const project of projects) {
            try {
                console.log(`Migrating project ${project.id}: "${project.title || project.name}"...`);

                // Check if project already exists in database
                const existing = await db.query(
                    'SELECT project_id FROM Projects WHERE title = $1 AND academic_year = $2',
                    [project.title || project.name, project.year || new Date().getFullYear().toString()]
                );

                if (existing.rows.length > 0) {
                    console.log(`  ⚠ Skipping - project already exists in database`);
                    continue;
                }

                // Prepare project data
                const projectData = {
                    name: project.name || project.title,
                    title: project.title || project.name,
                    description: project.description || '',
                    supervisor: project.supervisor || 'TBD',
                    Studentnames: project.Studentnames || [],
                    Tags: project.Tags || [],
                    category: project.category || 'General',
                    year: project.year || new Date().getFullYear().toString(),
                    grade: project.grade || 'Pending',
                    finalRemark: project.finalRemark || 'Evaluation pending',
                    attachment: project.attachment || null
                };

                // Create project using service
                const result = await projectService.createProject(projectData);

                if (result.success) {
                    console.log(`  ✓ Successfully migrated (new ID: ${result.project.id})`);
                    successCount++;
                } else {
                    console.log(`  ✗ Failed to migrate`);
                    errorCount++;
                    errors.push({ id: project.id, title: project.title, error: 'Service returned failure' });
                }
            } catch (error) {
                console.log(`  ✗ Error: ${error.message}`);
                errorCount++;
                errors.push({ id: project.id, title: project.title, error: error.message });
            }
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('Migration Summary:');
        console.log('='.repeat(50));
        console.log(`Total projects in JSON: ${projects.length}`);
        console.log(`Successfully migrated: ${successCount}`);
        console.log(`Errors: ${errorCount}`);
        console.log(`Skipped (already exist): ${projects.length - successCount - errorCount}`);

        if (errors.length > 0) {
            console.log('\nErrors encountered:');
            errors.forEach(err => {
                console.log(`  - Project ${err.id} (${err.title}): ${err.error}`);
            });
        }

        // Verify migration
        console.log('\n' + '='.repeat(50));
        console.log('Verification:');
        console.log('='.repeat(50));
        const countResult = await db.query('SELECT COUNT(*) FROM Projects');
        console.log(`Total projects in database: ${countResult.rows[0].count}`);

        console.log('\n✅ Migration completed!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    migrateJsonToDb()
        .then(() => {
            console.log('\nMigration process complete!');
            process.exit(0);
        })
        .catch(err => {
            console.error('\nMigration process failed:', err);
            process.exit(1);
        });
}

module.exports = migrateJsonToDb;
