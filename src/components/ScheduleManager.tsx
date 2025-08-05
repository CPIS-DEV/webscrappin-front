import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, PlayCircle, PauseCircle, Clock, Calendar, CalendarX, CalendarDays } from "lucide-react";
import { TagInput } from "./TagInput";
import { authenticatedFetch } from "../lib/api-client";

interface CronJob {
  id?: number;
  search_query: string[];
  schedule: string;
  weekdays?: string[];
  active: boolean;
  quant_dias?: number;
  email_envio?: string;
}

interface ScheduleManagerProps {
  onUpdate: () => void;
}

const WEEKDAYS = [
  { value: 'monday', label: 'Segunda' },
  { value: 'tuesday', label: 'Terça' },
  { value: 'wednesday', label: 'Quarta' },
  { value: 'thursday', label: 'Quinta' },
  { value: 'friday', label: 'Sexta' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
];

export function ScheduleManager({ onUpdate }: ScheduleManagerProps) {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [formData, setFormData] = useState<CronJob>({
    search_query: [],
    schedule: "",
    weekdays: [],
    active: true,
    quant_dias: 0,
    email_envio: ""
  });
  const { toast } = useToast();

  const loadCronJobs = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/cron');
      if (response.ok) {
        const data = await response.json();
        console.log('Dados recebidos da API:', data); // Debug
        
        // Verificar se o payload tem a estrutura { jobs: [...] }
        let jobs;
        if (data && Array.isArray(data.jobs)) {
          jobs = data.jobs;
        } else if (Array.isArray(data)) {
          jobs = data;
        } else {
          console.warn('Formato de resposta inesperado:', data);
          jobs = [];
        }
        
        setCronJobs(jobs);
      } else {
        console.error('Erro na resposta:', response.status);
        setCronJobs([]);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      setCronJobs([]);
      toast({
        title: "Erro",
        description: "Falha ao carregar agendamentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const resetForm = () => {
    setFormData({
      search_query: [],
      schedule: "",
      weekdays: [],
      active: true,
      quant_dias: 0,
      email_envio: ""
    });
    setEditingJob(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (job: CronJob) => {
    setEditingJob(job);
    setFormData({
      ...job,
      search_query: Array.isArray(job.search_query) ? job.search_query : [job.search_query],
      quant_dias: job.quant_dias ?? 0
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (formData.search_query.length === 0 || !formData.schedule) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const jobData = {
      ...formData,
      quant_dias: formData.quant_dias ?? 0,
      id: editingJob?.id
    };

    try {
      const method = editingJob ? 'PUT' : 'POST';
      const response = await authenticatedFetch('/cron', {
        method,
        body: JSON.stringify(jobData)
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingJob ? "Agendamento atualizado" : "Agendamento criado"
        });
        setDialogOpen(false);
        resetForm();
        loadCronJobs();
        onUpdate();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.message || "Falha ao salvar agendamento",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha na conexão com o servidor",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) {
      return;
    }

    try {
      const response = await authenticatedFetch('/cron', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Agendamento excluído"
        });
        loadCronJobs();
        onUpdate();
      } else {
        toast({
          title: "Erro",
          description: "Falha ao excluir agendamento",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha na conexão com o servidor",
        variant: "destructive"
      });
    }
  };

  const toggleJobStatus = async (job: CronJob) => {
    try {
      const response = await authenticatedFetch('/cron', {
        method: 'PUT',
        body: JSON.stringify({ ...job, active: !job.active })
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Agendamento ${!job.active ? 'ativado' : 'desativado'}`
        });
        loadCronJobs();
        onUpdate();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao alterar status",
        variant: "destructive"
      });
    }
  };

  const handleWeekdayChange = (weekday: string, checked: boolean) => {
    const currentWeekdays = formData.weekdays || [];
    if (checked) {
      setFormData({
        ...formData,
        weekdays: [...currentWeekdays, weekday]
      });
    } else {
      setFormData({
        ...formData,
        weekdays: currentWeekdays.filter(day => day !== weekday)
      });
    }
  };

  const formatSearchQuery = (query: string | string[]) => {
    if (Array.isArray(query)) {
      return query.join(", ");
    }
    return query;
  };

  const formatWeekdays = (weekdays?: string[]) => {
    if (!weekdays || weekdays.length === 0) {
      return "Todos os dias";
    }
    const dayNames = {
      'monday': 'Seg',
      'tuesday': 'Ter',
      'wednesday': 'Qua',
      'thursday': 'Qui',
      'friday': 'Sex',
      'saturday': 'Sáb',
      'sunday': 'Dom'
    };
    return weekdays.map(day => dayNames[day.toLowerCase() as keyof typeof dayNames]).join(", ");
  };

  useEffect(() => {
    loadCronJobs();
  }, [loadCronJobs]);

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Gerenciar Agendamentos
              </CardTitle>
              <CardDescription>
                Configure buscas automáticas no Diário Oficial
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="bg-gradient-primary hover:opacity-90">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Agendamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingJob ? "Editar Agendamento" : "Novo Agendamento"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure uma busca automática no Diário Oficial
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search-terms">Termos de Busca</Label>
                    <TagInput
                      tags={formData.search_query}
                      onChange={(tags) => setFormData({ ...formData, search_query: tags })}
                      placeholder="Digite um termo e pressione Enter"
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Horário (Brasília)
                    </Label>
                    <Input
                      id="schedule"
                      type="time"
                      value={formData.schedule}
                      onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    />
                  </div>

                  {/* Campo quant_dias (opcional, padrão 0) */}
                  <div className="space-y-2">
                    <Label htmlFor="quant_dias">Quantidade de dias em que a busca deve ser realizada</Label>
                    <Input
                      id="quant_dias"
                      type="number"
                      min={0}
                      value={formData.quant_dias ?? 0}
                      onChange={e => setFormData({ ...formData, quant_dias: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email_envio">Email para Envio dos resultados</Label>
                    <Input
                      id="email_envio"
                      type="email"
                      value={formData.email_envio ?? ""}
                      onChange={e => setFormData({ ...formData, email_envio: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Dias da Semana (deixe vazio para todos os dias)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {WEEKDAYS.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={day.value}
                            checked={(formData.weekdays || []).includes(day.value)}
                            onCheckedChange={(checked) => 
                              handleWeekdayChange(day.value, checked as boolean)
                            }
                          />
                          <Label htmlFor={day.value} className="text-sm">
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label htmlFor="active">Agendamento ativo</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmit} className="bg-gradient-primary hover:opacity-90">
                    {editingJob ? "Atualizar" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando agendamentos...</p>
            </div>
          ) : cronJobs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum agendamento configurado</p>
              <Button onClick={openCreateDialog} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Criar primeiro agendamento
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.isArray(cronJobs) && cronJobs.length > 0 ? (
                cronJobs.map((job) => (
                <div
                  key={job.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors animate-slide-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          {formatSearchQuery(job.search_query)}
                        </h3>
                        <Badge variant={job.active ? "default" : "secondary"}>
                          {job.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {job.schedule} (horário de Brasília)
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatWeekdays(job.weekdays)}
                        </p>
                        <p className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4" />
                          {job.quant_dias !== undefined && job.quant_dias > 0
                            ? `Buscar nos últimos ${job.quant_dias + 1} dias`
                            : "Buscar nos dias atuais"}
                        </p>
                        <p className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4" />
                          {job.email_envio !== undefined && !job.email_envio
                            ? `Resultados enviados para ${job.email_envio}`
                            : "Resultados enviados para o email principal do sistema"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleJobStatus(job)}
                      >
                        {job.active ? (
                          <PauseCircle className="w-4 h-4" />
                        ) : (
                          <PlayCircle className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(job)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => job.id && handleDelete(job.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum agendamento configurado</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}