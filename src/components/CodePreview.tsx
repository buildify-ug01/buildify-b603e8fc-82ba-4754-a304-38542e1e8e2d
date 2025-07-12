
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { RefreshCw } from 'lucide-react';

interface CodeFile {
  path: string;
  content: string;
}

interface CodePreviewProps {
  files: CodeFile[];
}

const CodePreview = ({ files }: CodePreviewProps) => {
  const [html, setHtml] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    generatePreviewHtml();
  }, [files, refreshKey]);

  const generatePreviewHtml = () => {
    // Find HTML, CSS, and JS files
    const htmlFile = files.find(file => file.path.endsWith('.html'));
    const cssFiles = files.filter(file => file.path.endsWith('.css'));
    const jsFiles = files.filter(file => 
      file.path.endsWith('.js') && !file.path.includes('node_modules')
    );

    // If no HTML file is found, try to create one from React components
    let htmlContent = htmlFile?.content || `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          <style id="preview-styles"></style>
        </head>
        <body>
          <div id="root"></div>
          <script id="preview-scripts"></script>
        </body>
      </html>
    `;

    // Inject CSS
    const cssContent = cssFiles.map(file => file.content).join('\n');
    htmlContent = htmlContent.replace('<style id="preview-styles"></style>', 
      `<style id="preview-styles">${cssContent}</style>`);

    // Inject JS
    const jsContent = jsFiles.map(file => file.content).join('\n');
    htmlContent = htmlContent.replace('<script id="preview-scripts"></script>', 
      `<script id="preview-scripts">${jsContent}</script>`);

    setHtml(htmlContent);
  };

  const refreshPreview = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Preview</h3>
        <Button variant="outline" size="sm" onClick={refreshPreview}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
      </div>
      
      {files.length === 0 ? (
        <div className="flex items-center justify-center h-full border rounded-md bg-gray-50 text-gray-500">
          No files to preview. Generate or add code first.
        </div>
      ) : (
        <div className="flex-1 border rounded-md overflow-hidden">
          <iframe
            title="Code Preview"
            srcDoc={html}
            className="w-full h-full"
            sandbox="allow-scripts"
          />
        </div>
      )}
    </div>
  );
};

export default CodePreview;