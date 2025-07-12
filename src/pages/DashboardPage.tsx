
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Code, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

const DashboardPage = () => {
  const { user, supabase } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setProjects(data || []);
    } catch (error: any) {
      toast.error('Failed to load projects');
      console.error('Error fetching projects:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async () => {
    if (!user) return;
    if (!newProjectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      setIsCreating(true);
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            user_id: user.id,
            name: newProjectName.trim(),
            description: newProjectDescription.trim() || null,
            status: 'draft',
            code_content: {}
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Project created successfully');
      setIsDialogOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      
      // Navigate to the new project
      if (data) {
        navigate(`/project/${data.id}`);
      } else {
        await fetchProjects();
      }
    } catch (error: any) {
      toast.error('Failed to create project');
      console.error('Error creating project:', error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        throw error;
      }

      toast.success('Project deleted successfully');
      setProjects(projects.filter(project => project.id !== projectId));
    } catch (error: any) {
      toast.error('Failed to delete project');
      console.error('Error deleting project:', error.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 sm:mb-0">My Projects</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Give your project a name and optional description to get started.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Project Name
                </label>
                <Input
                  id="name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Awesome App"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description (Optional)
                </label>
                <Input
                  id="description"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="A brief description of your project"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createProject} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto rounded-full w-12 h-12 flex items-center justify-center bg-blue-100 mb-4">
              <Code className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first project to get started building with AI.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gray-500">
                <p>
                  Last updated:{' '}
                  {new Date(project.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.status === 'published' 
                      ? 'bg-green-100 text-green-800' 
                      : project.status === 'archived'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => deleteProject(project.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button asChild size="sm">
                  <Link to={`/project/${project.id}`}>
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardPage;