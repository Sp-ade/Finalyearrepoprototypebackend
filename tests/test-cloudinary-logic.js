/**
 * Test script for revised getCloudinaryInfo logic in drop-tables.js
 */

function getCloudinaryInfo(url) {
    if (!url || !url.includes('cloudinary.com')) return null;

    try {
        const urlParts = url.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex === -1 || uploadIndex >= urlParts.length - 1) return null;

        let publicIdParts = urlParts.slice(uploadIndex + 1);

        // Remove version (v1234567) if present
        if (publicIdParts.length > 0 && publicIdParts[0].startsWith('v') && !isNaN(parseInt(publicIdParts[0].substring(1)))) {
            publicIdParts = publicIdParts.slice(1);
        }

        const fullPath = publicIdParts.join('/');

        // Determine resource type - documents and project artifacts are usually 'raw'
        const resourceType = (url.includes('/raw/') || url.includes('/project_artifacts/') || url.includes('/documents/')) ? 'raw' : 'image';

        // For 'raw' files, the public_id includes the extension. For images, it does not.
        let publicId = fullPath;
        if (resourceType !== 'raw') {
            const lastDotIndex = fullPath.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                publicId = fullPath.substring(0, lastDotIndex);
            }
        }

        return { publicId, resourceType };
    } catch (err) {
        console.error('Error parsing Cloudinary URL:', err.message);
        return null;
    }
}

const testUrls = [
    'https://res.cloudinary.com/demo/image/upload/v1570977806/sample.jpg',
    'https://res.cloudinary.com/demo/raw/upload/v1570977806/documents/resume.pdf',
    'https://res.cloudinary.com/demo/image/upload/sample.png',
    'https://res.cloudinary.com/demo/raw/upload/project_artifacts/report-12345.pdf'
];

testUrls.forEach(url => {
    console.log(`URL: ${url}`);
    console.log('Result:', getCloudinaryInfo(url));
    console.log('---');
});
