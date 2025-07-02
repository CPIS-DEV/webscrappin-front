
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Clock, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: number;
  search_query: string | string[];
  from_date: string;
  to_date: string;
  schedule: string;
  weekdays?: string[];
  active: boolean;
}

const JobManager = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const { toast } = useToast();

  // Estados do formulário
  const [formData, setFormData] = useState({
    search_query: '',
    from_date: '',
    to_date: '',
    schedule: '',
    weekdays: [] as string[],
    active: true
  });

  const weekdayOptions = [
    { value: 'monday', label: 'Segunda-feira' },
    { value: 'tuesday', label: 'Terça-feira' },
    { value: 'wednesday', label: 'Quarta-feira' },
    { value: 'thursday', label: 'Quinta-feira' },
    { value: 'friday', label: 'Sexta-feira' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('http://localhost:5000/cron');
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Erro ao carregar jobs:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar jobs agendados.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      search_query: '',
      from_date: '',
      to_date: '',
      schedule: '',
      weekdays: [],
      active: true
    });
    setEditingJob(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        search_query: formData.search_query.split(',').map(term => term.trim()),
        weekdays: formData.weekdays.length > 0 ? formData.weekdays : undefined
      };

      if (editingJob) {
        payload.id = editingJob.id;
      }

      const response = await fetch('http://localhost:5000/cron', {
        method: editingJob ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingJob ? "Job atualizado com sucesso!" : "Job criado com sucesso!",
        });
        fetchJobs();
        setDialogOpen(false);
        resetForm();
      } else {
        throw new Error('Erro na requisição');
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar job. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch('http://localhost:5000/cron', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Job removido com sucesso!",
        });
        fetchJobs();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover job.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      search_query: Array.isArray(job.search_query) ? job.search_query.join(', ') : job.search_query,
      from_date: job.from_date,
      to_date: job.to_date,
      schedule: job.schedule,
      weekdays: job.weekdays || [],
      active: job.active
    });
    setDialogOpen(true);
  };

  const formatSearchQuery = (query: string | string[]) => {
    if (Array.isArray(query)) {
      return query.join(', ');
    }
    return query;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-cpis-blue">Jobs Agendados</h2>
          <p className="text-muted-foreground">Gerencie as buscas automáticas no Diário Oficial</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-cpis-blue hover:bg-cpis-blue-dark">
              <Plus className="mr-2 h-4 w-4" />
              Novo Job
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingJob ? 'Editar Job' : 'Criar Novo Job'}
              </DialogTitle>
              <DialogDescription>
                Configure um job para busca automática no Diário Oficial
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-search-query">Termos de Busca</Label>
                <Textarea
                  id="dialog-search-query"
                  placeholder="Digite os termos separados por vírgula"
                  value={formData.search_query}
                  onChange={(e) => setFormData({...formData, search_query: e.target.value})}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dialog-from-date">Data Inicial</Label>
                  <Input
                    id="dialog-from-date"
                    type="date"
                    value={formData.from_date}
                    onChange={(e) => setFormData({...formData, from_date: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dialog-to-date">Data Final</Label>
                  <Input
                    id="dialog-to-date"
                    type="date"
                    value={formData.to_date}
                    onChange={(e) => setFormData({...formData, to_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dialog-schedule">Horário (Brasília)</Label>
                <Input
                  id="dialog-schedule"
                  type="time"
                  value={formData.schedule}
                  onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Dias da Semana (opcional - deixe vazio para todos os dias)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {weekdayOptions.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={day.value}
                        checked={formData.weekdays.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              weekdays: [...formData.weekdays, day.value]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              weekdays: formData.weekdays.filter(d => d !== day.value)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={day.value} className="text-sm">{day.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="dialog-active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                />
                <Label htmlFor="dialog-active">Job Ativo</Label>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-cpis-blue hover:bg-cpis-blue-dark"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingJob ? 'Atualizar' : 'Criar'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum job encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro job para automatizar as buscas no Diário Oficial
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-cpis-blue" />
                    <CardTitle className="text-lg">
                      Busca: {formatSearchQuery(job.search_query)}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.active ? "default" : "secondary"}>
                      {job.active ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(job)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(job.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Período:</span>
                    <p className="text-muted-foreground">
                      {job.from_date} até {job.to_date}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Horário:</span>
                    <p className="text-muted-foreground">{job.schedule}</p>
                  </div>
                  <div>
                    <span className="font-medium">Dias:</span>
                    <p className="text-muted-foreground">
                      {job.weekdays && job.weekdays.length > 0 
                        ? job.weekdays.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')
                        : 'Todos os dias'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default JobManager;
