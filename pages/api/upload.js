import { IncomingForm } from 'formidable';
import { isAuthorized } from '../../utils/auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_EXTENSIONS = new Set(['.glb', '.gltf', '.jpg', '.jpeg', '.png', '.webp']);
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function getExtension(filename) {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx).toLowerCase() : '';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return res.status(500).json({ error: 'Upload failed' });
      }

      const uploadedFiles = Object.values(files).flat();
      for (const file of uploadedFiles) {
        const ext = getExtension(file.originalFilename || file.newFilename || '');
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          return res.status(400).json({ error: `File type "${ext}" is not allowed` });
        }
      }

      return res.status(200).json({
        message: 'Upload successful',
        fields,
        files
      });
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}
