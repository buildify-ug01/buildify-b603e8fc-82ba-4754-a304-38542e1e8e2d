
import { useState } from 'react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { File, Folder } from 'lucide-react';

interface CodeFile {
  path: string;
  content: string;
}

interface CodeEditorProps {
  files: CodeFile[];
  activeFile: string | null;
  setActiveFile: (path: string) => void;
  updateFileContent: (path: string, content: string) => void;
}

const CodeEditor = ({ files, activeFile, setActiveFile, updateFileContent }: CodeEditorProps) => {
  const getFileIcon = (path: string) => {
    const extension = path.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <File className="h-4 w-4 text-yellow-500" />;
      case 'css':
      case 'scss':
        return <File className="h-4 w-4 text-blue-500" />;
      case 'html':
        return <File className="h-4 w-4 text-orange-500" />;
      case 'json':
        return <File className="h-4 w-4 text-green-500" />;
      case 'md':
        return <File className="h-4 w-4 text-gray-500" />;
      default:
        return <File className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (activeFile) {
      updateFileContent(activeFile, e.target.value);
    }
  };

  // Group files by directory
  const groupFilesByDirectory = () => {
    const groups: Record<string, CodeFile[]> = {};
    
    files.forEach(file => {
      const parts = file.path.split('/');
      const directory = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
      
      if (!groups[directory]) {
        groups[directory] = [];
      }
      
      groups[directory].push(file);
    });
    
    return groups;
  };

  const fileGroups = groupFilesByDirectory();

  return (
    <div className="flex h-[500px] border rounded-md overflow-hidden">
      {/* File Explorer */}
      <div className="w-64 border-r bg-gray-50">
        <div className="p-3 border-b bg-gray-100">
          <h3 className="font-medium text-sm">Files</h3>
        </div>
        <ScrollArea className="h-[460px]">
          <div className="p-2">
            {Object.entries(fileGroups).map(([directory, dirFiles]) => (
              <div key={directory} className="mb-3">
                {directory !== 'root' && (
                  <div className="flex items-center text-sm text-gray-500 font-medium mb-1 pl-2">
                    <Folder className="h-4 w-4 mr-1" />
                    {directory}
                  </div>
                )}
                <div className="space-y-1">
                  {dirFiles.map(file => (
                    <Button
                      key={file.path}
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start text-xs ${
                        activeFile === file.path
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setActiveFile(file.path)}
                    >
                      {getFileIcon(file.path)}
                      <span className="ml-2 truncate">
                        {file.path.split('/').pop()}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {activeFile ? (
          <>
            <div className="p-2 border-b bg-gray-100 text-sm font-medium">
              {activeFile}
            </div>
            <textarea
              className="flex-1 p-4 font-mono text-sm resize-none outline-none"
              value={files.find(f => f.path === activeFile)?.content || ''}
              onChange={handleContentChange}
              spellCheck={false}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a file to edit
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;