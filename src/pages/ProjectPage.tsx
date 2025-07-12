
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import CodeEditor from '../components/CodeEditor';
import CodePreview from '../components/CodePreview';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Save, Play, Download, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  code_content: any;
  status: 'draft' | 'published' | 'archived';
}

interface CodeFile {
  path: string;
  content: string;
}

const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, supabase } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [apiKeys, setApiKeys] = useState<{id: string, name: string}[]>([]);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>('');
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('editor');

  useEffect(() => {
    if (id) {
      fetchProject(id);
      fetchApiKeys();
    }
  }, [id, user]);

  const fetchProject = async (projectId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProject(data);
        
        // Initialize files from code_content
        if (data.code_content && data.code_content.files) {
          setFiles(data.code_content.files);
          if (data.code_content.files.length > 0) {
            setActiveFile(data.code_content.files[0].path);
          }
        }
      }
    } catch (error: any) {
      toast.error('Failed to load project');
      console.error('Error fetching project:', error.message);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('id, name')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      setApiKeys(data || []);
      if (data && data.length > 0) {
        setSelectedApiKeyId(data[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching API keys:', error.message);
    }
  };

  const saveProject = async () => {
    if (!project) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('projects')
        .update({
          code_content: { files },
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (error) {
        throw error;
      }

      toast.success('Project saved successfully');
    } catch (error: any) {
      toast.error('Failed to save project');
      console.error('Error saving project:', error.message);
    } finally {
      setSaving(false);
    }
  };

  const generateCode = async () => {
    if (!prompt.trim() || !selectedApiKeyId) {
      toast.error('Please enter a prompt and select an API key');
      return;
    }

    try {
      setGenerating(true);
      
      const response = await fetch(`https://qxuxrwhmcwhjwbwrdrsn.supabase.co/functions/v1/8b9c3afe-28c3-4c21-bfb0-eab4af2c46d0`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.auth.getSession()}`
        },
        body: JSON.stringify({
          prompt,
          apiKeyId: selectedApiKeyId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate code');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.files && Array.isArray(data.files)) {
        setFiles(data.files);
        if (data.files.length > 0) {
          setActiveFile(data.files[0].path);
        }
        
        // Save the generated code
        await saveProject();
        
        toast.success('Code generated successfully');
      } else if (data.rawResponse) {
        // Handle case where response couldn't be parsed as JSON
        toast.error('Generated code format is invalid');
        console.error('Raw response:', data.rawResponse);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate code');
      console.error('Error generating code:', error);
    } finally {
      setGenerating(false);
    }
  };

  const updateFileContent = (path: string, newContent: string) => {
    setFiles(files.map(file => 
      file.path === path ? { ...file, content: newContent } : file
    ));
  };

  const downloadProject = () => {
    if (!files.length) {
      toast.error('No files to download');
      return;
    }

    // Create a zip file using JSZip
    import('jszip').then(({ default: JSZip }) => {
      const zip = new JSZip();
      
      // Add all files to the zip
      files.forEach(file => {
        zip.file(file.path, file.content);
      });
      
      // Generate the zip file
      zip.generateAsync({ type: 'blob' }).then(content => {
        // Create a download link
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project?.name || 'project'}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }).catch(err => {
      toast.error('Failed to download project');
      console.error('Error downloading project:', err);
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-2" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={saveProject} 
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
          <Button onClick={downloadProject}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-lg font-medium mb-2">Generate Code with AI</h2>
          <div className="space-y-4 bg-white p-4 rounded-lg border">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
                Select API Key
              </label>
              <select
                id="apiKey"
                className="w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedApiKeyId}
                onChange={(e) => setSelectedApiKeyId(e.target.value)}
              >
                {apiKeys.length === 0 ? (
                  <option value="">No API keys available</option>
                ) : (
                  apiKeys.map((key) => (
                    <option key={key.id} value={key.id}>
                      {key.name}
                    </option>
                  ))
                )}
              </select>
              {apiKeys.length === 0 && (
                <p className="mt-1 text-sm text-red-600">
                  You need to add an API key in the Admin panel first.
                </p>
              )}
            </div>
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                Describe what you want to build
              </label>
              <Textarea
                id="prompt"
                placeholder="Create a responsive navbar with a logo, navigation links, and a mobile menu"
                className="min-h-[100px]"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>
            <Button 
              className="w-full" 
              onClick={generateCode} 
              disabled={generating || !selectedApiKeyId}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Generate Code
                </>
              )}
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-2">Project Details</h2>
          <div className="space-y-4 bg-white p-4 rounded-lg border">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <Input
                id="name"
                value={project.name}
                onChange={(e) => setProject({ ...project, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                id="description"
                value={project.description || ''}
                onChange={(e) => setProject({ ...project, description: e.target.value })}
                placeholder="Add a description for your project"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                className="w-full rounded-md border border-gray-300 py-2 px-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={project.status}
                onChange={(e) => setProject({ 
                  ...project, 
                  status: e.target.value as 'draft' | 'published' | 'archived' 
                })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={saveProject} 
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Details'}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="editor">Code Editor</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="editor" className="border rounded-lg p-4 bg-white min-h-[500px]">
          <CodeEditor 
            files={files} 
            activeFile={activeFile} 
            setActiveFile={setActiveFile} 
            updateFileContent={updateFileContent}
          />
        </TabsContent>
        <TabsContent value="preview" className="border rounded-lg p-4 bg-white min-h-[500px]">
          <CodePreview files={files} />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default ProjectPage;