import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Search, Calendar, FileText, Settings, Download, Plus, Edit, Trash2, PlayCircle, PauseCircle, LogOut, User } from "lucide-react";
import { ManualSearch } from "./ManualSearch";
import { ScheduleManager } from "./ScheduleManager";
import { SystemLogs } from "./SystemLogs";
import { SystemSettings } from "./SystemSettings";
import { authenticatedFetch } from "../lib/api-client";
import { useAuth } from "../hooks/use-auth";

interface CronJob {
  id: number;
  search_query: string | string[];
  schedule: string;
  weekdays?: string[];
  active: boolean;
}

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  inactiveJobs: number;
  lastExecution?: string;
}

export function Dashboard() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    inactiveJobs: 0
  });
  const [loading, setLoading] = useState(true);
  const [isManualSearchRunning, setIsManualSearchRunning] = useState(false);
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const loadCronJobs = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/cron');
      if (response.ok) {
        const data = await response.json();
        console.log('Dados do Dashboard:', data); // Debug
        
        // Verificar se o payload tem a estrutura { jobs: [...] }
        let jobs;
        if (data && Array.isArray(data.jobs)) {
          jobs = data.jobs;
          // Usar as estatísticas que vêm da API se disponíveis
          setStats({
            totalJobs: data.total_jobs || jobs.length,
            activeJobs: data.jobs_ativos || jobs.filter((job: CronJob) => job.active).length,
            inactiveJobs: data.jobs_inativos || jobs.filter((job: CronJob) => !job.active).length,
            lastExecution: data.ultima_execucao
          });
        } else if (Array.isArray(data)) {
          jobs = data;
          setStats({
            totalJobs: jobs.length,
            activeJobs: jobs.filter((job: CronJob) => job.active).length,
            inactiveJobs: jobs.filter((job: CronJob) => !job.active).length
          });
        } else {
          jobs = [];
          setStats({
            totalJobs: 0,
            activeJobs: 0,
            inactiveJobs: 0
          });
        }
        
        setCronJobs(jobs);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar agendamentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const downloadRegistro = async () => {
    try {
      const response = await authenticatedFetch('/registro');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'registro.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Sucesso",
          description: "Arquivo de registro baixado com sucesso"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao baixar arquivo de registro",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadCronJobs();
  }, [loadCronJobs]);

  const formatLastExecution = (isoDate?: string) => {
    if (!isoDate) return "Não disponível";
    
    try {
      const date = new Date(isoDate);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return "Data inválida";
      }
      
      // Sempre mostrar data e hora completa no horário de Brasília
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error, isoDate);
      return "Erro na formatação";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-background relative">
      {/* Overlay bloqueio */}
      {isManualSearchRunning && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center cursor-not-allowed select-none"
          onClick={() => {
            toast({
              title: "Atenção",
              description: "Não são permitidas trocas de telas enquanto buscas estão sendo executadas.",
              variant: "destructive"
            });
          }}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-3">
            <Search className="w-8 h-8 text-primary animate-pulse" />
            <span className="text-lg font-semibold text-primary">Busca manual em andamento...</span>
            <span className="text-sm text-muted-foreground text-center">Por favor, aguarde o término da busca para continuar navegando.</span>
          </div>
        </div>
      )}
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                Sistema de Monitoramento - Diário Oficial
              </h1>
              <p className="text-muted-foreground">
                Companhia Paulista de Infraestrutura Social
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">
                  {user?.username || 'Usuário'}
                </span>
              </div>
              <Button onClick={downloadRegistro} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Baixar Logs
              </Button>
              <Button onClick={logout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Jobs</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalJobs}</div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Ativos</CardTitle>
              <PlayCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.activeJobs}</div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobs Inativos</CardTitle>
              <PauseCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.inactiveJobs}</div>
            </CardContent>
          </Card>

          <Card className="shadow-soft hover:shadow-medium transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Execução</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-muted-foreground">
                {formatLastExecution(stats.lastExecution)}
              </div>
              {stats.lastExecution && (
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(stats.lastExecution).toLocaleString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short'
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Busca Manual
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Logs do Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <ManualSearch 
              onSearchStart={() => setIsManualSearchRunning(true)}
              onSearchEnd={() => setIsManualSearchRunning(false)}
            />
          </TabsContent>

          <TabsContent value="schedule">
            <ScheduleManager onUpdate={loadCronJobs} />
          </TabsContent>

          <TabsContent value="settings">
            <SystemSettings />
          </TabsContent>

          <TabsContent value="logs">
            <SystemLogs />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}