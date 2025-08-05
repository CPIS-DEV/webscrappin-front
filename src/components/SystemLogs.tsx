import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { FileText, RefreshCw, Download, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { authenticatedFetch } from "../lib/api-client";

interface LogEntry {
  timestamp: string;
  type: 'busca' | 'agendamento' | 'erro';
  content: string;
  results?: number;
}

export function SystemLogs() {
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/registro');
      if (response.ok) {
        const blob = await response.blob();
        const text = await blob.text();
        setLogs(text);
        setLastUpdate(new Date().toLocaleString('pt-BR'));
        
        toast({
          title: "Logs atualizados",
          description: "Dados mais recentes carregados com sucesso"
        });
      } else {
        toast({
          title: "Erro",
          description: "Falha ao carregar logs do sistema",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const downloadLogs = async () => {
    try {
      const response = await authenticatedFetch('/registro');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-sistema-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download concluído",
          description: "Arquivo de logs baixado com sucesso"
        });
      }
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Falha ao baixar arquivo de logs",
        variant: "destructive"
      });
    }
  };

  const parseLogEntries = (logText: string): LogEntry[] => {
    const entries: LogEntry[] = [];
    const lines = logText.split('\n');
    
    let currentEntry: Partial<LogEntry> = {};
    
    for (const line of lines) {
      if (line.includes('Busca') && (line.includes('realizada') || line.includes('agendada'))) {
        if (currentEntry.content) {
          entries.push(currentEntry as LogEntry);
        }
        currentEntry = {
          timestamp: line.substring(0, 19),
          type: line.includes('agendada') ? 'agendamento' : 'busca',
          content: line
        };
      } else if (line.includes('encontrados') && line.includes('resultados')) {
        const match = line.match(/(\d+)\s+resultados/);
        if (match && currentEntry.content !== undefined) {
          currentEntry.results = parseInt(match[1]);
          currentEntry.content += '\n' + line;
        }
      } else if (line.trim() && currentEntry.content !== undefined) {
        currentEntry.content += '\n' + line;
      }
    }
    
    if (currentEntry.content) {
      entries.push(currentEntry as LogEntry);
    }
    
    return entries.reverse();
  };

  const getEntryIcon = (type: string, results?: number) => {
    if (type === 'erro') return <AlertCircle className="w-4 h-4 text-destructive" />;
    if (results && results > 0) return <CheckCircle className="w-4 h-4 text-success" />;
    return <Clock className="w-4 h-4 text-muted-foreground" />;
  };

  const getEntryBadge = (type: string, results?: number) => {
    if (type === 'agendamento') return <Badge variant="outline">Agendado</Badge>;
    if (type === 'busca') return <Badge variant="default">Manual</Badge>;
    return <Badge variant="destructive">Erro</Badge>;
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const logEntries = parseLogEntries(logs);

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Logs do Sistema
              </CardTitle>
              <CardDescription>
                Histórico de execuções e atividades do sistema de monitoramento
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchLogs}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Atualizar
              </Button>
              <Button
                onClick={downloadLogs}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          {lastUpdate && (
            <p className="text-sm text-muted-foreground mt-2">
              Última atualização: {lastUpdate}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando logs...</p>
            </div>
          ) : logs ? (
            <div className="space-y-4">
              {logEntries.length > 0 ? (
                <ScrollArea className="h-96 w-full">
                  <div className="space-y-3">
                    {logEntries.map((entry, index) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getEntryIcon(entry.type, entry.results)}
                            <span className="text-sm font-medium">
                              Busca Realizada
                            </span>
                            {getEntryBadge(entry.type, entry.results)}
                            {entry.results !== undefined && entry.results > 0 && (
                              <Badge variant="secondary">
                                {entry.results} resultado{entry.results !== 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {entry.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum log encontrado</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Falha ao carregar logs</p>
              <Button onClick={fetchLogs} variant="outline" className="mt-4">
                Tentar novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}