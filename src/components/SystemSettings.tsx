import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Mail, Save, X, Plus, RefreshCw } from "lucide-react";
import { authenticatedFetch } from "../lib/api-client";

interface SystemConfig {
  email_principal: string;
  emails_aviso: string[];
  ultima_alteracao_por?: string;
  ultima_alteracao_em?: string;
  acessado_por?: string;
}

export function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    email_principal: "",
    emails_aviso: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const { toast } = useToast();

  // Carregar configurações da API
  const loadConfig = useCallback(async () => {
    try {
      setLoadingData(true);
      const response = await authenticatedFetch('/config');
      if (response.ok) {
        const data = await response.json();
        console.log('Configurações carregadas:', data);
        setConfig({
          email_principal: data.email_principal || "",
          emails_aviso: data.emails_aviso || [],
          ultima_alteracao_por: data.ultima_alteracao_por,
          ultima_alteracao_em: data.ultima_alteracao_em,
          acessado_por: data.acessado_por
        });
      } else {
        toast({
          title: "Erro",
          description: "Falha ao carregar configurações",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão ao carregar configurações",
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmailAviso = () => {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      toast({
        title: "Erro",
        description: "Digite um email válido",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      toast({
        title: "Erro",
        description: "Formato de email inválido",
        variant: "destructive"
      });
      return;
    }

    if (config.emails_aviso.includes(trimmedEmail)) {
      toast({
        title: "Erro",
        description: "Este email já está na lista",
        variant: "destructive"
      });
      return;
    }

    setConfig({
      ...config,
      emails_aviso: [...config.emails_aviso, trimmedEmail]
    });
    setNewEmail("");
  };

  const removeEmailAviso = (index: number) => {
    setConfig({
      ...config,
      emails_aviso: config.emails_aviso.filter((_, i) => i !== index)
    });
  };

  const handleSave = async () => {
    if (!config.email_principal.trim()) {
      toast({
        title: "Erro",
        description: "Email principal é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(config.email_principal)) {
      toast({
        title: "Erro",
        description: "Email principal tem formato inválido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await authenticatedFetch('/config', {
        method: 'PUT',
        body: JSON.stringify({
          email_principal: config.email_principal,
          emails_aviso: config.emails_aviso
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Configurações salvas",
          description: result.message || "As configurações foram atualizadas com sucesso"
        });
        // Recarregar para pegar dados atualizados (como última alteração)
        loadConfig();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.message || "Falha ao salvar configurações",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmailAviso();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configure os emails de notificação e outras preferências do sistema
              </CardDescription>
            </div>
            <Button onClick={loadConfig} variant="outline" size="sm" disabled={loadingData}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingData ? 'animate-spin' : ''}`} />
              Recarregar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando configurações...</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email-principal" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Principal
                </Label>
                <Input
                  id="email-principal"
                  type="email"
                  placeholder="email@empresa.com.br"
                  value={config.email_principal}
                  onChange={(e) => setConfig({ ...config, email_principal: e.target.value })}
                />
                <p className="text-sm text-muted-foreground">
                  Email principal que receberá os resultados das buscas e documentos anexados
                </p>
              </div>

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Emails para Avisos e Notificações
                </Label>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="adicionar@email.com.br"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button onClick={addEmailAviso} variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {config.emails_aviso.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {config.emails_aviso.map((email, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {email}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => removeEmailAviso(index)}
                          />
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Nenhum email de aviso configurado
                    </p>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  Emails que receberão notificações sobre o status das buscas, relatórios e alertas do sistema
                </p>
              </div>

              {/* Informações de auditoria */}
              {(config.ultima_alteracao_por || config.acessado_por) && (
                <div className="bg-muted/50 p-3 rounded-lg space-y-1">
                  <h4 className="font-medium text-sm">📝 Histórico de Alterações</h4>
                  {config.ultima_alteracao_por && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Última alteração:</strong> {config.ultima_alteracao_por} em{' '}
                      {config.ultima_alteracao_em ? new Date(config.ultima_alteracao_em).toLocaleString('pt-BR') : 'data não disponível'}
                    </p>
                  )}
                  {config.acessado_por && (
                    <p className="text-xs text-muted-foreground">
                      <strong>Visualizado por:</strong> {config.acessado_por}
                    </p>
                  )}
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="bg-accent/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">ℹ️ Informações Úteis sobre o Sistema</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Email Principal:</strong> Recebe documentos PDF anexados e resultados completos</li>
                    <li>• <strong>Emails de Aviso:</strong> Recebem apenas notificações de status</li>
                    <li>• <strong>Limite de Arquivos:</strong> Arquivos acima de 25MB são enviados apenas como links</li>
                    <li>• <strong>Limite de Envios:</strong> Há um limite de 6 resultados enviados por busca. Resultados excedentes serão enviados como link em um email adicional</li>
                    <li>• <strong>Limite de Buscas:</strong> Há um limite de 20 resultados por busca.</li>
                    <li>• <strong>Busca sem Resultados:</strong> Email de aviso recebem notificação quando nenhum resultado é encontrado em buscas agendadas</li>
                  </ul>
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={loading}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}